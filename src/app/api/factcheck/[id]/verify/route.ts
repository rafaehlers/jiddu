import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyClaim, VERIFY_MODEL } from "@/lib/llm/verifyClaim";
import { consume, ipFromRequest, rateLimitResponse } from "@/lib/rate-limit";
import { bucketFromSettings, loadSettings } from "@/lib/settings";
import type { Claim } from "@/lib/claims-schema";
import type { Verdict } from "@/lib/verdict-schema";
import type { Lang } from "@/lib/fallacies";

export const runtime = "nodejs";
export const maxDuration = 300;

const VERIFY_CONCURRENCY = 6;

type ClaimWithId = Claim & { id: string };

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const settings = await loadSettings();
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

  const lang = (fc.language && ["en", "pt", "es"].includes(fc.language)
    ? fc.language
    : "en") as Lang;

  await prisma.factCheck.update({
    where: { id },
    data: {
      verifyStatus: "running",
      verifyModel: VERIFY_MODEL,
      verifyStartedAt: new Date(),
      verifyFinishedAt: null,
      verdicts: JSON.stringify([]),
    },
  });

  const encoder = new TextEncoder();
  const abortController = new AbortController();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      send("meta", {
        id,
        model: VERIFY_MODEL,
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
            });
            localRefreshCounts[claim.id] = (localRefreshCounts[claim.id] ?? 0) + 1;
            if (result.cached) cacheHits++;
            else cacheMisses++;
            // Strip the cache flag before persisting; UI still sees it via SSE.
            const { cached, ...verdict } = result;
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
      controller.close();
    },
    cancel() {
      abortController.abort();
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
