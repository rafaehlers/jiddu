import { NextRequest } from "next/server";
import { recordContextSessionEvents } from "@/lib/context-session-events";
import { prisma } from "@/lib/db";
import { verifyClaim } from "@/lib/llm/verifyClaim";
import { consume, ipFromRequest, rateLimitResponse } from "@/lib/rate-limit";
import {
  bucketFromSettings,
  factCheckModelForAttempt,
  loadSettings,
  loadStringSettings,
} from "@/lib/settings";
import type { Claim } from "@/lib/claims-schema";
import type { Verdict } from "@/lib/verdict-schema";
import type { Lang } from "@/lib/fallacies";
import { normalizeAppLanguage } from "@/lib/language";
import {
  isAccessResponse,
  requireWebAnalysisAccess,
} from "@/lib/web-analysis-access";
import { modelCreditRate } from "@/lib/jiddu-credit-rates";
import { releaseJidduCreditReservation } from "@/lib/jiddu-credits";
import {
  createWebAnalysisUsageSettlement,
  isCreditResponse,
  reserveWebAnalysisCredits,
} from "@/lib/web-credit-billing";

export const runtime = "nodejs";
export const maxDuration = 120;

type ClaimWithId = Claim & { id: string };

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; claimId: string }> },
) {
  const access = await requireWebAnalysisAccess();
  if (isAccessResponse(access)) return access;

  const [settings, stringSettings] = await Promise.all([
    loadSettings(),
    loadStringSettings(),
  ]);
  const rl = consume(
    `verify1:${ipFromRequest(req)}`,
    bucketFromSettings(settings, "rate.singleVerify"),
  );
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

  const maxRefreshPerClaim = Math.max(
    1,
    Math.floor(settings["factcheck.maxRefreshPerClaim"]),
  );

  const { id, claimId } = await ctx.params;
  const requestBody = (await req.json().catch(() => null)) as {
    elapsedMs?: unknown;
  } | null;
  const suppliedElapsedMs =
    typeof requestBody?.elapsedMs === "number" &&
    Number.isFinite(requestBody.elapsedMs) &&
    requestBody.elapsedMs >= 0
      ? Math.floor(requestBody.elapsedMs)
      : null;

  const fc = await prisma.factCheck.findUnique({ where: { id } });
  if (!fc) return jsonError("Not found", 404);
  if (access.userId && fc.ownerWorkosUserId !== access.userId) {
    return jsonError("Not found", 404);
  }

  const claims = JSON.parse(fc.claims) as ClaimWithId[];
  const claim = claims.find((c) => c.id === claimId);
  if (!claim) return jsonError("Claim not found", 404);

  // Per-claim refresh cap. We count every verify call (bulk or single)
  // against the same counter so the user can't bypass via either path.
  const refreshCounts = parseRefreshCounts(fc.refreshCounts);
  const currentCount = refreshCounts[claimId] ?? 0;
  if (currentCount >= maxRefreshPerClaim) {
    return jsonError(
      `This claim has reached the max-refresh cap (${maxRefreshPerClaim}).`,
      429,
    );
  }

  const lang: Lang = normalizeAppLanguage(fc.language);
  const verifyModel = factCheckModelForAttempt(stringSettings, currentCount);

  const reservation = await reserveWebAnalysisCredits(access, {
    amount: modelCreditRate(verifyModel),
    feature: "factcheck_verify",
    resourceId: id,
    metadata: { claimId, forcedRefresh: true, model: verifyModel },
  });
  if (isCreditResponse(reservation)) return reservation;
  const settleUsage = createWebAnalysisUsageSettlement(access, reservation, {
    feature: "factcheck_verify",
    resourceId: id,
    metadata: { claimId, forcedRefresh: true, model: verifyModel },
  });

  // Force a fresh Sonar call — the per-claim refresh button is the user
  // explicitly saying "I don't trust the cached verdict, do it again".
  let fresh;
  try {
    fresh = await verifyClaim(claim, {
      lang,
      force: true,
      apiKey: access.apiKey,
      sourceUrl: fc.sourceRef,
      model: verifyModel,
    });
  } catch (err) {
    await releaseJidduCreditReservation(reservation);
    console.error(
      `[/api/factcheck/${id}/claim/${claimId}/verify] error:`,
      err,
    );
    return jsonError(err instanceof Error ? err.message : "Verify failed", 500);
  }

  // Replace this claim's verdict in the persisted verdicts JSON.
  const current = JSON.parse(fc.verdicts) as Verdict[];
  const filtered = current.filter((v) => v.claimId !== claimId);
  const { cached, usage, ...verdictRecord } = fresh;
  void cached; // Cache provenance is response-only and is not persisted.
  filtered.push(verdictRecord);

  const nextCounts = { ...refreshCounts, [claimId]: currentCount + 1 };

  try {
    await prisma.factCheck.update({
      where: { id },
      data: {
        verdicts: JSON.stringify(filtered),
        refreshCounts: JSON.stringify(nextCounts),
        // If this was the first verdict (none before), mark as complete.
        verifyStatus:
          fc.verifyStatus === "none" ? "complete" : fc.verifyStatus,
        verifyFinishedAt: new Date(),
        verifyModel,
      },
    });
    try {
      const analysis = await prisma.analysis.findUnique({
        where: { id },
        select: { audioDurationMs: true },
      });
      await recordContextSessionEvents({
        analysisId: id,
        ownerWorkosUserId: fc.ownerWorkosUserId,
        events: [
          {
            kind: "claim_verified",
            elapsedMs: suppliedElapsedMs ?? analysis?.audioDurationMs ?? 0,
            sentenceIds: claim.sentenceIds,
            payload: verdictRecord,
          },
        ],
      });
    } catch (eventError) {
      console.error("[factcheck/claim] replay event failed", eventError);
    }
  } finally {
    await settleUsage({
      usages: usage ? [usage] : [],
      fallbackModels: [verifyModel],
    });
  }

  return new Response(
    JSON.stringify({
      ...verdictRecord,
      cached,
      refreshCount: currentCount + 1,
      maxRefreshPerClaim,
    }),
    {
      headers: { "content-type": "application/json" },
    },
  );
}

function parseRefreshCounts(raw: string): Record<string, number> {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const out: Record<string, number> = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
      }
      return out;
    }
  } catch {
    // ignore
  }
  return {};
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}
