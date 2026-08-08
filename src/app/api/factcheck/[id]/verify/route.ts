import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyClaim } from "@/lib/llm/verifyClaim";
import { consume, ipFromRequest, rateLimitResponse } from "@/lib/rate-limit";
import {
  bucketFromSettings,
  loadSettings,
  loadStringSettings,
} from "@/lib/settings";
import type { Claim } from "@/lib/claims-schema";
import type { Verdict } from "@/lib/verdict-schema";
import type { Lang } from "@/lib/fallacies";
import {
  isAccessResponse,
  requireWebAnalysisAccess,
} from "@/lib/web-analysis-access";
import {
  modelCreditRate,
} from "@/lib/jiddu-credit-rates";
import {
  releaseJidduCreditReservation,
} from "@/lib/jiddu-credits";
import {
  createWebAnalysisUsageSettlement,
  isCreditResponse,
  reserveWebAnalysisCredits,
} from "@/lib/web-credit-billing";
import type { OpenRouterUsage } from "@/lib/openrouter-usage";

export const runtime = "nodejs";
export const maxDuration = 300;

const VERIFY_CONCURRENCY = 6;

type ClaimWithId = Claim & { id: string };

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const access = await requireWebAnalysisAccess();
  if (isAccessResponse(access)) return access;

  const [settings, stringSettings] = await Promise.all([
    loadSettings(),
    loadStringSettings(),
  ]);
  const verifyModel = stringSettings["factcheck.fastModel"];
  const rl = consume(
    `verify:${ipFromRequest(req)}`,
    bucketFromSettings(settings, "rate.verify"),
  );
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

  const maxRefreshPerClaim = Math.max(
    1,
    Math.floor(settings["factcheck.maxRefreshPerClaim"]),
  );

  const { id } = await ctx.params;
  const fc = await prisma.factCheck.findUnique({ where: { id } });
  if (!fc) return jsonError("Not found", 404);
  if (access.userId && fc.ownerWorkosUserId !== access.userId) {
    return jsonError("Not found", 404);
  }
  if (fc.verifyStatus === "running") {
    return jsonError("Verification already in progress", 409);
  }

  const claims = JSON.parse(fc.claims) as ClaimWithId[];
  if (claims.length === 0) {
    return jsonError("No claims to verify", 422);
  }

  // Per-claim refresh counter: a bulk verify counts as one refresh against
  // every claim. Filter out claims that have hit the cap so we don't burn
  // budget on them. If everything is capped, return early.
  const refreshCounts = parseRefreshCounts(fc.refreshCounts);
  const eligibleClaims = claims.filter(
    (c) => (refreshCounts[c.id] ?? 0) < maxRefreshPerClaim,
  );
  if (eligibleClaims.length === 0) {
    return jsonError(
      `All claims have hit the max-refresh cap (${maxRefreshPerClaim}). Increase factcheck.maxRefreshPerClaim in admin settings or wait.`,
      429,
    );
  }

  const reservation = await reserveWebAnalysisCredits(access, {
    amount: eligibleClaims.length * modelCreditRate(verifyModel),
    feature: "factcheck_verify",
    resourceId: id,
    metadata: { eligibleClaimCount: eligibleClaims.length, model: verifyModel },
  });
  if (isCreditResponse(reservation)) return reservation;

  const lang = (fc.language && ["en", "pt", "es"].includes(fc.language)
    ? fc.language
    : "en") as Lang;

  try {
    await prisma.factCheck.update({
      where: { id },
      data: {
        verifyStatus: "running",
        verifyModel,
        verifyStartedAt: new Date(),
        verifyFinishedAt: null,
        verdicts: JSON.stringify([]),
      },
    });
  } catch {
    await releaseJidduCreditReservation(reservation);
    return jsonError("Could not start verification", 500);
  }

  const encoder = new TextEncoder();
  const abortController = new AbortController();
  let billableCacheMisses = 0;
  const usages: OpenRouterUsage[] = [];
  const settleUsage = createWebAnalysisUsageSettlement(access, reservation, {
    feature: "factcheck_verify",
    resourceId: id,
    metadata: { eligibleClaimCount: eligibleClaims.length, model: verifyModel },
  });
  const settle = () =>
    settleUsage({
      usages,
      fallbackModels: Array.from(
        { length: billableCacheMisses },
        () => verifyModel,
      ),
      metadata: { uncachedClaimCalls: billableCacheMisses },
    });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      send("meta", {
        id,
        model: verifyModel,
        claimCount: eligibleClaims.length,
        skippedCount: claims.length - eligibleClaims.length,
        language: lang,
      });

      const verdicts: Verdict[] = [];
      const errors: { claimId: string; message: string }[] = [];
      let cursor = 0;
      let cacheHits = 0;
      let cacheMisses = 0;
      const localRefreshCounts: Record<string, number> = { ...refreshCounts };

      const launch = async () => {
        while (true) {
          const idx = cursor++;
          if (idx >= eligibleClaims.length) return;
          const claim = eligibleClaims[idx];
          if (abortController.signal.aborted) return;
          try {
            const result = await verifyClaim(claim, {
              lang,
              signal: abortController.signal,
              apiKey: access.apiKey,
              sourceUrl: fc.sourceRef,
              model: verifyModel,
            });
            localRefreshCounts[claim.id] = (localRefreshCounts[claim.id] ?? 0) + 1;
            if (result.cached) cacheHits++;
            else {
              cacheMisses++;
              billableCacheMisses++;
              if (result.usage) usages.push(result.usage);
            }
            // Strip the cache flag before persisting; UI still sees it via SSE.
            const { cached, usage: _usage, ...verdict } = result;
            void _usage;
            verdicts.push(verdict);
            send("verdict", { ...verdict, cached });
          } catch (err) {
            if (abortController.signal.aborted) return;
            const message = err instanceof Error ? err.message : String(err);
            console.error(
              `[/api/factcheck/${id}/verify] claim ${claim.id} failed:`,
              err,
            );
            errors.push({ claimId: claim.id, message });
            send("claimError", { claimId: claim.id, message });
          }
        }
      };

      const workers: Promise<void>[] = [];
      for (let i = 0; i < Math.min(VERIFY_CONCURRENCY, claims.length); i++) {
        workers.push(launch());
      }
      await Promise.all(workers);

      // If every claim failed, mark the whole verification as failed.
      if (verdicts.length === 0 && errors.length > 0) {
        const message = errors.map((e) => e.message).join(" / ");
        await prisma.factCheck.update({
          where: { id },
          data: {
            verifyStatus: "failed",
            verifyFinishedAt: new Date(),
            errorMessage: message,
          },
        });
        send("error", { error: message });
        await settle();
        controller.close();
        return;
      }

      // Merge new verdicts into existing ones (a bulk verify only touched
      // the eligible claims; verdicts for capped claims should be kept).
      const existingVerdicts = JSON.parse(fc.verdicts) as Verdict[];
      const verdictById = new Map(existingVerdicts.map((v) => [v.claimId, v]));
      for (const v of verdicts) verdictById.set(v.claimId, v);

      await prisma.factCheck.update({
        where: { id },
        data: {
          verifyStatus: "complete",
          verifyFinishedAt: new Date(),
          verdicts: JSON.stringify(Array.from(verdictById.values())),
          refreshCounts: JSON.stringify(localRefreshCounts),
        },
      });

      send("done", {
        id,
        verdictCount: verdicts.length,
        errorCount: errors.length,
        cacheHits,
        cacheMisses,
      });
      await settle();
      controller.close();
    },
    async cancel() {
      abortController.abort();
      await settle();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
      connection: "keep-alive",
    },
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
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
