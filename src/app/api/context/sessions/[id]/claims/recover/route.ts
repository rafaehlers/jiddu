import { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { ClaimSchema, type Claim } from "@/lib/claims-schema";
import { acquireConcurrency } from "@/lib/concurrency-limit";
import { recordContextSessionEvents } from "@/lib/context-session-events";
import { replaceEntityNamesInClaims } from "@/lib/context-session-mutations";
import { prisma } from "@/lib/db";
import type { Lang } from "@/lib/fallacies";
import { maxCreditsForCalls } from "@/lib/jiddu-credit-rates";
import {
  filterNewRecoveredClaims,
  planLiveClaimRecovery,
} from "@/lib/live-claim-recovery";
import { liveSpeakerAttribution } from "@/lib/live-analysis-config";
import { readLiveContext } from "@/lib/live-context-schema";
import { getProvider, resolveModel } from "@/lib/llm";
import {
  DEFAULT_MODEL_CHAIN,
  withModelFallback,
} from "@/lib/llm/fallback";
import type { OpenRouterUsage } from "@/lib/openrouter-usage";
import { consume, rateLimitResponse } from "@/lib/rate-limit";
import type { Sentence } from "@/lib/schema";
import { bucketFromSettings, loadSettings } from "@/lib/settings";
import {
  isAccessResponse,
  requireWebAnalysisAccess,
} from "@/lib/web-analysis-access";
import {
  createWebAnalysisUsageSettlement,
  isCreditResponse,
  reserveWebAnalysisCredits,
} from "@/lib/web-credit-billing";

export const runtime = "nodejs";
export const maxDuration = 300;

const BodySchema = z.object({
  lang: z.enum(["en", "pt", "es"]).default("en"),
});

const SERIALIZABLE_ATTEMPTS = 3;

type ClaimWithId = Claim & { id: string };

export async function POST(
  request: NextRequest,
  routeContext: { params: Promise<{ id: string }> },
) {
  const access = await requireWebAnalysisAccess();
  if (isAccessResponse(access)) return access;
  const body = BodySchema.safeParse(await request.json().catch(() => ({})));
  if (!body.success) {
    return Response.json({ error: "Invalid recovery request." }, { status: 400 });
  }

  const settings = await loadSettings();
  const identity = access.userId ?? access.email ?? "unknown";
  const rate = consume(
    `context:claims-recovery:${identity}`,
    bucketFromSettings(settings, "rate.factcheck"),
  );
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);
  const permit = acquireConcurrency(
    `context:claims-recovery:${identity}`,
    1,
  );
  if (!permit) return rateLimitResponse(2);

  const { id } = await routeContext.params;
  try {
    const [analysis, factCheck, previousRecoveries] = await Promise.all([
      prisma.analysis.findFirst({
        where: {
          id,
          ownerWorkosUserId: access.userId,
          source: "live",
        },
        select: {
          id: true,
          status: true,
          sourceRef: true,
          language: true,
          model: true,
          sentences: true,
          liveContext: true,
          audioDurationMs: true,
          ownerWorkosUserId: true,
        },
      }),
      prisma.factCheck.findFirst({
        where: { id, ownerWorkosUserId: access.userId },
        select: { claims: true, verifyStatus: true },
      }),
      prisma.contextSessionEvent.findMany({
        where: { analysisId: id, kind: "operation_completed" },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { payload: true },
      }),
    ]);
    if (!analysis || !factCheck) return jsonError("Session not found", 404);
    if (analysis.status !== "complete") {
      return jsonError("Finish the session before recovering facts.", 409);
    }
    if (factCheck.verifyStatus === "running") {
      return jsonError("Wait for the current verification to finish.", 409);
    }

    const existingClaims = parseArray<ClaimWithId>(factCheck.claims);
    const maxClaims = Math.max(
      1,
      Math.floor(settings["factcheck.maxClaims"]),
    );
    if (existingClaims.length >= maxClaims) {
      return Response.json({
        claims: existingClaims,
        addedCount: 0,
        claimCount: existingClaims.length,
        maxClaims,
        hasMore: true,
        atLimit: true,
      });
    }

    const sentences = parseArray<Sentence>(analysis.sentences);
    if (sentences.length === 0) {
      return jsonError("This session has no recoverable transcript.", 422);
    }
    const recoveryCursor = previousRecoveries
      .map((event) => readRecoveryCursor(event.payload))
      .find((cursor) => cursor !== null);
    const plan = planLiveClaimRecovery({
      sentences,
      existingClaims,
      lastScannedSentenceId:
        recoveryCursor?.complete === false
          ? recoveryCursor.lastScannedSentenceId
          : null,
    });
    if (plan.chunks.length === 0) {
      return Response.json({
        claims: existingClaims,
        addedCount: 0,
        claimCount: existingClaims.length,
        maxClaims,
        hasMore: false,
        atLimit: false,
      });
    }

    const modelChain = Array.from(
      new Set([resolveModel(analysis.model).id, ...DEFAULT_MODEL_CHAIN]),
    );
    const llm = getProvider(modelChain[0], access.apiKey);
    const reservation = await reserveWebAnalysisCredits(access, {
      amount: maxCreditsForCalls(modelChain, plan.chunks.length),
      feature: "factcheck_extract",
      resourceId: id,
      metadata: {
        recovery: true,
        modelChain,
        chunkCount: plan.chunks.length,
      },
    });
    if (isCreditResponse(reservation)) return reservation;

    const usages: OpenRouterUsage[] = [];
    const billableModels: string[] = [];
    const settleUsage = createWebAnalysisUsageSettlement(access, reservation, {
      feature: "factcheck_extract",
      resourceId: id,
      metadata: {
        recovery: true,
        modelChain,
        chunkCount: plan.chunks.length,
      },
    });
    const liveContext = readLiveContext(analysis.liveContext);
    const speakerAttribution = liveSpeakerAttribution(
      liveContext.analysisConfig,
    );
    const replacements = liveContext.entities
      .filter((entity) => entity.userCorrectedName)
      .flatMap((entity) =>
        entity.aliases.map((alias) => ({ from: alias, to: entity.name })),
      );
    const candidates: Claim[] = [];
    const available = maxClaims - existingClaims.length;
    let lastScannedSentenceId: string | null = null;
    const processedSentenceIds: string[] = [];
    let providerFailed = false;

    try {
      await recordContextSessionEvents({
        analysisId: id,
        ownerWorkosUserId: analysis.ownerWorkosUserId,
        events: [
          {
            kind: "operation_started",
            elapsedMs: analysis.audioDurationMs ?? 0,
            sentenceIds: plan.scannedSentenceIds,
            payload: { operation: "claims_recovery" },
          },
        ],
      });

      for (const chunk of plan.chunks) {
        const chunkIds = new Set(chunk.map((sentence) => sentence.id));
        const chunkStart = sentences.findIndex(
          (sentence) => sentence.id === chunk[0]?.id,
        );
        const contextSentences = sentences.slice(
          Math.max(0, chunkStart - 4),
          Math.max(0, chunkStart),
        );
        try {
          for await (const event of withModelFallback(
            modelChain,
            (model) =>
              llm.extractClaimsStream(
                {
                  sentences: chunk,
                  lang: body.data.lang as Lang,
                  contextSentences,
                  sourceUrl: analysis.sourceRef,
                  analysisConfig: liveContext.analysisConfig,
                },
                {
                  model,
                  signal: request.signal,
                  onUsage: (usage) => usages.push(usage),
                },
              ),
            request.signal,
            (model) => billableModels.push(model),
          )) {
            if (event.type !== "claim") continue;
            if (candidates.length >= available) break;
            const parsed = ClaimSchema.safeParse(event.claim);
            if (
              !parsed.success ||
              parsed.data.sentenceIds.length === 0 ||
              parsed.data.sentenceIds.some(
                (sentenceId) => !chunkIds.has(sentenceId),
              )
            ) {
              continue;
            }
            const attributed = {
              ...parsed.data,
              ...(speakerAttribution ?? {}),
            };
            const corrected = replacements.length
              ? stripClaimId(
                  replaceEntityNamesInClaims(
                    [{ id: "candidate", ...attributed }],
                    replacements,
                  )[0],
                )
              : attributed;
            const accepted = filterNewRecoveredClaims(
              [corrected],
              [...existingClaims, ...candidates],
            );
            if (accepted.length > 0) candidates.push(accepted[0]);
          }
          if (candidates.length >= available) break;
          processedSentenceIds.push(
            ...chunk.map((sentence) => sentence.id),
          );
          lastScannedSentenceId = chunk.at(-1)?.id ?? lastScannedSentenceId;
        } catch (error) {
          providerFailed = true;
          console.error("[context/claims/recover] chunk failed", error);
          break;
        }
      }
    } finally {
      await settleUsage({
        usages,
        fallbackModels: billableModels,
        metadata: {
          models: billableModels,
          completed: !providerFailed,
        },
      });
    }

    if (providerFailed && candidates.length === 0) {
      return jsonError("Fact recovery could not be completed.", 502);
    }

    const persisted = await serializableTransaction(async (tx) => {
      const latest = await tx.factCheck.findFirst({
        where: { id, ownerWorkosUserId: access.userId },
        select: { claims: true },
      });
      if (!latest) throw new RecoveryRequestError("Session not found", 404);
      const latestClaims = parseArray<ClaimWithId>(latest.claims);
      const additions = filterNewRecoveredClaims(candidates, latestClaims).slice(
        0,
        Math.max(0, maxClaims - latestClaims.length),
      );
      let counter = highestClaimCounter(latestClaims);
      const storedAdditions = additions.map((claim) => ({
        id: `c${++counter}`,
        ...claim,
      }));
      const claims = [...latestClaims, ...storedAdditions];
      await tx.factCheck.update({
        where: { id },
        data: { claims: JSON.stringify(claims), reviewedAt: null },
      });
      return { claims, storedAdditions };
    });

    const atLimit = persisted.claims.length >= maxClaims;
    const hasMore = plan.hasMore || providerFailed || atLimit;
    await recordContextSessionEvents({
      analysisId: id,
      ownerWorkosUserId: analysis.ownerWorkosUserId,
      events: [
        ...persisted.storedAdditions.map((claim) => ({
          kind: "claim_detected" as const,
          elapsedMs: analysis.audioDurationMs ?? 0,
          sentenceIds: claim.sentenceIds,
          payload: claim,
        })),
        {
          kind: "operation_completed" as const,
          elapsedMs: analysis.audioDurationMs ?? 0,
          sentenceIds: processedSentenceIds,
          payload: {
            operation: "claims_recovery",
            addedCount: persisted.storedAdditions.length,
            claimCount: persisted.claims.length,
            lastScannedSentenceId,
            complete: !hasMore,
            atLimit,
          },
        },
      ],
    });

    return Response.json({
      claims: persisted.claims,
      addedCount: persisted.storedAdditions.length,
      claimCount: persisted.claims.length,
      maxClaims,
      hasMore,
      atLimit,
    });
  } catch (error) {
    if (error instanceof RecoveryRequestError) {
      return jsonError(error.message, error.status);
    }
    console.error("[context/claims/recover] failed", error);
    return jsonError("Fact recovery could not be completed.", 500);
  } finally {
    permit.release();
  }
}

function readRecoveryCursor(raw: string | null | undefined): {
  lastScannedSentenceId: string | null;
  complete: boolean;
} | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (value.operation !== "claims_recovery") return null;
    return {
      lastScannedSentenceId:
        typeof value.lastScannedSentenceId === "string"
          ? value.lastScannedSentenceId
          : null,
      complete: value.complete === true,
    };
  } catch {
    return null;
  }
}

function stripClaimId(claim: ClaimWithId): Claim {
  const withoutId: Partial<ClaimWithId> = { ...claim };
  delete withoutId.id;
  return withoutId as Claim;
}

function parseArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? (value as T[]) : [];
  } catch {
    return [];
  }
}

function highestClaimCounter(claims: ClaimWithId[]): number {
  return claims.reduce((highest, claim) => {
    const match = /^c(\d+)$/.exec(claim.id);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
}

async function serializableTransaction<T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < SERIALIZABLE_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(work, {
        isolationLevel: "Serializable",
      });
    } catch (error) {
      lastError = error;
      if (!isPrismaError(error, "P2034")) throw error;
    }
  }
  throw lastError;
}

function isPrismaError(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

function jsonError(error: string, status: number): Response {
  return Response.json({ error }, { status });
}

class RecoveryRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
