import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { splitSentences } from "@/lib/sentences";
import { getProvider, resolveModel } from "@/lib/llm";
import {
  withModelFallback,
  withModelFallbackPromise,
} from "@/lib/llm/fallback";
import { loadAnalysisRouting } from "@/lib/analysis-routing";
import { FindingSchema, type Finding, type Sentence } from "@/lib/schema";
import { ClaimSchema, type Claim } from "@/lib/claims-schema";
import {
  NeutralityFindingSchema,
  type NeutralityFinding,
  type NeutralityVerdictValue,
  type TextType,
} from "@/lib/neutrality-schema";
import type { Lang } from "@/lib/fallacies";
import {
  isAccessResponse,
  requireWebAnalysisAccess,
} from "@/lib/web-analysis-access";
import { maxCreditsForCalls } from "@/lib/jiddu-credit-rates";
import {
  recordIncludedJidduCreditUsage,
  releaseJidduCreditReservation,
  settleJidduCreditReservationFromUsage,
  type JidduCreditReservationHandle,
} from "@/lib/jiddu-credits";
import {
  isCreditResponse,
  reserveWebAnalysisCredits,
} from "@/lib/web-credit-billing";
import type { OpenRouterUsage } from "@/lib/openrouter-usage";
import { acquireConcurrency } from "@/lib/concurrency-limit";
import { consume, rateLimitResponse } from "@/lib/rate-limit";
import { bucketFromSettings, loadSettings } from "@/lib/settings";
import { buildLiveAnalysisTitle } from "@/lib/live-title";
import { normalizeLiveDurationMs } from "@/lib/live-billing";
import { normalizeLiveLenses, type LiveLens } from "@/lib/live-lenses";
import {
  mergeLiveContext,
  readLiveContext,
  sanitizeLiveContextWindow,
  type LiveContext,
  type LiveContextWindow,
} from "@/lib/live-context-schema";
import { syncContextKnowledgeMentions } from "@/lib/context-knowledge";
import { recordContextSessionEvents } from "@/lib/context-session-events";
import { normalizeCapturedSourceUrl } from "@/lib/live-source-context";
import { resolveLiveNeutrality } from "@/lib/live-neutrality";
import { replaceEntityNamesInClaims } from "@/lib/context-session-mutations";
import {
  liveSpeakerAttribution,
  normalizeLiveAnalysisConfig,
} from "@/lib/live-analysis-config";
import {
  applyLiveAnalysisConfig,
  createLiveContextForAnalysis,
} from "@/lib/live-analysis-context";
import {
  createServerSseWriter,
  type ServerSseWriter,
} from "@/lib/server-sse";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_TRANSCRIPT_CHARS = 500_000;
const MIN_NEW_CHARS_TO_ANALYZE = 80;
const CONTEXT_SENTENCE_COUNT = 4;
const SERIALIZABLE_ATTEMPTS = 3;

type Body = {
  billingReservationId?: string;
  sessionId?: string;
  text?: string;
  sourceUrl?: unknown;
  lang?: string;
  lenses?: string[];
  timeZone?: string;
  finalize?: boolean;
  audioDurationMs?: number;
  elapsedMs?: number;
  analysisConfig?: unknown;
};

type ClaimWithId = Claim & { id: string };

export async function POST(req: NextRequest) {
  const access = await requireWebAnalysisAccess();
  if (isAccessResponse(access)) return access;

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return jsonError("Invalid JSON", 400);
  const analysisRouting = await loadAnalysisRouting();

  const text = typeof body.text === "string" ? body.text : "";
  const sourceUrlWasSupplied = Object.prototype.hasOwnProperty.call(
    body,
    "sourceUrl",
  );
  const suppliedSourceUrl = normalizeCapturedSourceUrl(body.sourceUrl);
  if (
    typeof body.sourceUrl === "string" &&
    body.sourceUrl.trim() &&
    !suppliedSourceUrl
  ) {
    return jsonError("Invalid captured source URL", 400);
  }
  const lang = normalizeLang(body.lang);
  const requestedAnalysisConfig = normalizeLiveAnalysisConfig(
    body.analysisConfig,
    lang,
  );
  const lenses = normalizeLiveLenses(body.lenses);
  const finalize = body.finalize === true;
  const billingReservationId =
    typeof body.billingReservationId === "string"
      ? body.billingReservationId.trim()
      : "";
  const audioDurationMs = finalize
    ? normalizeLiveDurationMs(body.audioDurationMs)
    : undefined;
  const captureElapsedMs = normalizeLiveDurationMs(
    finalize ? body.audioDurationMs : body.elapsedMs,
  );

  if (text.length > MAX_TRANSCRIPT_CHARS) {
    return jsonError("Transcript too long", 413);
  }
  if (!text && !finalize) {
    return jsonError("Empty transcript", 400);
  }

  // ── Load or create session row ────────────────────────────────────────
  let row;
  let isNew = false;
  if (body.sessionId) {
    row = await prisma.analysis.findUnique({ where: { id: body.sessionId } });
    if (!row) return jsonError("Session not found", 404);
    if (access.userId && row.ownerWorkosUserId !== access.userId) {
      return jsonError("Session not found", 404);
    }
    if (row.source !== "live") return jsonError("Not a live session", 400);
    if (row.status === "complete" || row.status === "failed") {
      return jsonError(`Session already ${row.status}`, 409);
    }
  } else {
    const chosenModel = resolveModel(analysisRouting.modelChain[0]);
    let llm;
    try {
      llm = getProvider(
        chosenModel.id,
        access.apiKey,
        analysisRouting.providerRoutingByModel,
      );
    } catch (err) {
      return jsonError(
        err instanceof Error ? err.message : "Provider error",
        400,
      );
    }
    const id = nanoid(10);
    const initialLiveContext = createLiveContextForAnalysis(
      requestedAnalysisConfig,
      lang,
    );
    row = await prisma.analysis.create({
      data: {
        id,
        ownerWorkosUserId: access.userId ?? null,
        status: "running",
        source: "live",
        sourceRef: suppliedSourceUrl,
        title: null,
        text: "",
        transcript: "",
        language: lang,
        provider: llm.id,
        model: llm.defaultModel,
        score: 0,
        summary: null,
        liveContext: JSON.stringify(initialLiveContext),
        sentences: JSON.stringify([]),
        findings: JSON.stringify([]),
      },
    });
    isNew = true;
    try {
      await recordContextSessionEvents({
        analysisId: row.id,
        ownerWorkosUserId: row.ownerWorkosUserId,
        events: [
          {
            kind: "context_snapshot",
            elapsedMs: 0,
            sentenceIds: [],
            payload: initialLiveContext,
          },
        ],
      });
    } catch (eventError) {
      console.error("[live/analyze] initial replay event failed", eventError);
    }
  }

  const capturedSourceUrl = sourceUrlWasSupplied
    ? suppliedSourceUrl
    : normalizeCapturedSourceUrl(row.sourceRef);

  // ── Compute what's new and worth analyzing ───────────────────────────
  const existingSentences = safeJsonArray<Sentence>(row.sentences);
  const existingFindings = safeJsonArray<Finding>(row.findings);
  const storedLiveContext = readLiveContext(row.liveContext);
  const analysisConfig =
    body.analysisConfig === undefined
      ? storedLiveContext.analysisConfig
      : requestedAnalysisConfig;
  const existingLiveContext = applyLiveAnalysisConfig(
    storedLiveContext,
    analysisConfig,
    lang,
  );
  const speakerAttribution = liveSpeakerAttribution(analysisConfig);

  const allSentences = splitSentences(text);

  // Re-split can renumber sentence IDs when sentence boundaries shift
  // (e.g., a trailing partial absorbs more text). Anchor against the
  // existing committed sentences by text identity to find the true new ones.
  const committedCount = countMatchingPrefix(existingSentences, allSentences);
  const newSentencesRaw = allSentences.slice(committedCount);

  // Hold back the trailing partial unless finalizing — it might grow.
  const toAnalyze = finalize ? newSentencesRaw : newSentencesRaw.slice(0, -1);

  const newCharCount = toAnalyze.reduce((acc, s) => acc + s.text.length, 0);

  // Skip LLM if there's not enough new content (except on finalize).
  const shouldAnalyze =
    toAnalyze.length > 0 &&
    (finalize || newCharCount >= MIN_NEW_CHARS_TO_ANALYZE);
  const shouldFinalizeNeutrality =
    finalize && lenses.includes("neutrality") && allSentences.length > 0;
  // Related-news discovery is intentionally absent from finalization. Public
  // enrichment may run while capture is live, but stopping must not wait for
  // an external news provider before the workspace can be saved.
  const shouldCallProvider = shouldAnalyze || shouldFinalizeNeutrality;

  const contextSentences = existingSentences.slice(-CONTEXT_SENTENCE_COUNT);

  const identity = access.userId ?? access.email ?? "unknown";
  const settings = shouldCallProvider ? await loadSettings() : null;
  const rate = settings
    ? consume(
        `live:analyze:${identity}`,
        bucketFromSettings(settings, "rate.liveAnalyze"),
      )
    : null;
  if (rate && !rate.allowed) {
    if (isNew) {
      await prisma.analysis.delete({ where: { id: row.id } });
    }
    return rateLimitResponse(rate.retryAfterSec);
  }

  const permit = shouldCallProvider
    ? acquireConcurrency(`live:analyze:${identity}`, 1)
    : null;
  if (shouldCallProvider && !permit) {
    if (isNew) {
      await prisma.analysis.delete({ where: { id: row.id } });
    }
    return rateLimitResponse(1);
  }

  // ── Provider setup ───────────────────────────────────────────────────
  const chosenModel = resolveModel(row.model);
  const modelChain = Array.from(
    new Set([chosenModel.id, ...analysisRouting.modelChain]),
  );
  let llm;
  try {
    llm = getProvider(
      chosenModel.id,
      access.apiKey,
      analysisRouting.providerRoutingByModel,
    );
  } catch (err) {
    permit?.release();
    return jsonError(
      err instanceof Error ? err.message : "Provider error",
      400,
    );
  }

  let reservation: JidduCreditReservationHandle | null | Response;
  try {
    reservation = shouldCallProvider
      ? await reserveWebAnalysisCredits(access, {
          amount: shouldAnalyze
            ? maxCreditsForCalls(modelChain, lenses.length)
            : shouldFinalizeNeutrality
              ? maxCreditsForCalls(modelChain, 1)
              : 0,
          feature: "live_analysis",
          resourceId: row.id,
          metadata: {
            model: chosenModel.id,
            lenses,
          },
        })
      : null;
  } catch (error) {
    permit?.release();
    throw error;
  }
  if (reservation && isCreditResponse(reservation)) {
    permit?.release();
    if (isNew) {
      await prisma.analysis.delete({ where: { id: row.id } });
    }
    return reservation;
  }

  let factCheckRow: Awaited<ReturnType<typeof prisma.factCheck.findUnique>> =
    null;
  let neutralityRow: Awaited<ReturnType<typeof prisma.neutrality.findUnique>> =
    null;
  try {
    [factCheckRow, neutralityRow] = await Promise.all([
      lenses.includes("factcheck")
        ? prisma.factCheck.upsert({
            where: { id: row.id },
            update: { sourceRef: capturedSourceUrl },
            create: {
              id: row.id,
              ownerWorkosUserId: row.ownerWorkosUserId,
              status: "running",
              source: "live",
              sourceRef: capturedSourceUrl,
              title: row.title,
              text: row.text,
              language: row.language ?? lang,
              provider: row.provider,
              model: row.model,
              sentences: row.sentences,
              claims: JSON.stringify([]),
            },
          })
        : null,
      lenses.includes("neutrality")
        ? prisma.neutrality.upsert({
            where: { id: row.id },
            update: { sourceRef: capturedSourceUrl },
            create: {
              id: row.id,
              ownerWorkosUserId: row.ownerWorkosUserId,
              status: "running",
              source: "live",
              sourceRef: capturedSourceUrl,
              title: row.title,
              text: row.text,
              language: row.language ?? lang,
              provider: row.provider,
              model: row.model,
              sentences: row.sentences,
              findings: JSON.stringify([]),
            },
          })
        : null,
    ]);
  } catch (error) {
    permit?.release();
    if (reservation && !(reservation instanceof Response)) {
      await releaseJidduCreditReservation(reservation);
    }
    if (isNew) await deleteLiveRows(row.id);
    throw error;
  }

  let existingClaims = safeJsonArray<ClaimWithId>(
    factCheckRow?.claims ?? "[]",
  );
  const existingNeutralityFindings = safeJsonArray<NeutralityFinding>(
    neutralityRow?.findings ?? "[]",
  );

  // ── Stream ───────────────────────────────────────────────────────────
  const abortController = new AbortController();
  let sseWriter: ServerSseWriter | null = null;
  const fallbackModels: string[] = [];
  const usages: OpenRouterUsage[] = [];
  let settled = false;
  const settle = async () => {
    if (settled) return;
    settled = true;
    const settlement = await settleJidduCreditReservationFromUsage(
      reservation,
      {
        usages,
        fallbackModels,
        resourceId: row.id,
        metadata: { model: chosenModel.id, lenses },
        aggregateIntoLive:
          billingReservationId && access.billing === "jiddu" && access.userId
            ? {
                reservationId: billingReservationId,
                workosUserId: access.userId,
              }
            : undefined,
      },
    );
    if (
      access.billing === "platform" &&
      fallbackModels.length > 0 &&
      access.userId &&
      access.email
    ) {
      await recordIncludedJidduCreditUsage({
        workosUserId: access.userId,
        email: access.email,
        feature: "live_analysis",
        resourceId: row.id,
        note: "Included platform access",
        metadata: { model: chosenModel.id, lenses },
        usage: settlement,
      });
    }
  };

  let stream: ReadableStream<Uint8Array>;
  try {
    stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const writer = createServerSseWriter(controller);
          sseWriter = writer;
          const send = writer.send;

          if (isNew) {
            send("meta", {
              id: row.id,
              model: row.model,
              provider: row.provider,
              lenses,
            });
          }

          const newFindings: Finding[] = [];
          const newClaims: ClaimWithId[] = [];
          const newNeutralityFindings: NeutralityFinding[] = [];
          let nextLiveContext: LiveContext = existingLiveContext;
          let windowScore = 0;
          let windowSummary = "";
          let windowLanguage: string | null = null;
          let windowNeutralityVerdict: NeutralityVerdictValue | null = null;
          let windowNeutralityConfidence = 0;
          let windowNeutralityRationale = "";
          let windowTextType: TextType | null = null;
          let finalNeutralityRecalculated = false;

          if (shouldAnalyze || shouldFinalizeNeutrality) {
            const tasks: Promise<void>[] = [];

            if (shouldAnalyze && lenses.includes("context")) {
              tasks.push(
                (async () => {
                  try {
                    const response = await withModelFallbackPromise(
                      modelChain,
                      (model) =>
                        llm.analyzeLiveContext(
                          {
                            sentences: toAnalyze,
                            lang,
                            contextSentences,
                            previous: existingLiveContext,
                            analysisConfig,
                            finalize,
                            sourceUrl: capturedSourceUrl,
                          },
                          {
                            model,
                            signal: abortController.signal,
                            onUsage: (usage) => usages.push(usage),
                          },
                        ),
                      abortController.signal,
                      (model) => fallbackModels.push(model),
                    );
                    const sanitized = sanitizeLiveContextWindow(
                      response.result,
                      new Set(toAnalyze.map((sentence) => sentence.id)),
                    );
                    if (!sanitized) return;
                    nextLiveContext = mergeLiveContext(
                      existingLiveContext,
                      sanitized,
                    );
                    windowLanguage ??= sanitized.language ?? null;
                    // Persist the graph before exposing it to the browser so
                    // rename, merge and removal controls are safe to use as
                    // soon as the card appears. Complete the private mention
                    // index first as well, avoiding a stale sync racing a
                    // listener mutation from this same analysis window.
                    const persistedContext = await persistLiveContextWindow({
                      analysisId: row.id,
                      expectedRevision: row.contextRevision,
                      nextContext: nextLiveContext,
                      analyzedWindow: sanitized,
                    });
                    nextLiveContext = persistedContext.context;
                    if (row.ownerWorkosUserId) {
                      try {
                        await syncContextKnowledgeMentions({
                          analysisId: row.id,
                          ownerWorkosUserId: row.ownerWorkosUserId,
                          context: nextLiveContext,
                        });
                      } catch (knowledgeError) {
                        // Public indexing is additive; the saved private graph
                        // remains usable even if enrichment is unavailable.
                        console.error(
                          "[live/analyze] knowledge sync failed",
                          knowledgeError,
                        );
                      }
                    }
                    try {
                      await recordContextSessionEvents({
                        analysisId: row.id,
                        ownerWorkosUserId: row.ownerWorkosUserId,
                        events: [
                          {
                            kind: "context_snapshot",
                            elapsedMs: captureElapsedMs,
                            sentenceIds: contextSentenceIds(nextLiveContext),
                            payload: nextLiveContext,
                          },
                        ],
                      });
                    } catch (eventError) {
                      console.error(
                        "[live/analyze] context replay event failed",
                        eventError,
                      );
                    }
                    send("context", nextLiveContext);
                  } catch (err) {
                    sendLensError(send, "context", err, abortController.signal);
                  }
                })(),
              );
            }

            if (shouldAnalyze && lenses.includes("fallacy")) {
              tasks.push(
                (async () => {
                  const seen = new Set<string>(
                    existingFindings.map(findingKey),
                  );
                  try {
                    for await (const event of withModelFallback(
                      modelChain,
                      (model) =>
                        llm.analyzeStream(
                          {
                            sentences: toAnalyze,
                            lang,
                            contextSentences,
                            analysisConfig,
                          },
                          {
                            model,
                            signal: abortController.signal,
                            onUsage: (usage) => usages.push(usage),
                          },
                        ),
                      abortController.signal,
                      (model) => fallbackModels.push(model),
                    )) {
                      if (event.type === "finding") {
                        if (!isAnchoredToWindow(event.finding, toAnalyze)) {
                          continue;
                        }
                        const key = findingKey(event.finding);
                        if (seen.has(key)) continue;
                        const parsed = FindingSchema.safeParse(event.finding);
                        if (!parsed.success) continue;
                        seen.add(key);
                        const stored = {
                          ...parsed.data,
                          ...(speakerAttribution ?? {}),
                        };
                        newFindings.push(stored);
                        send("finding", stored);
                      } else if (event.type === "score") {
                        windowScore = event.score;
                      } else if (event.type === "summary") {
                        windowSummary = event.summary;
                      } else if (event.type === "language") {
                        windowLanguage = event.language;
                      }
                    }
                  } catch (err) {
                    sendLensError(send, "fallacy", err, abortController.signal);
                  }
                })(),
              );
            }

            if (shouldAnalyze && lenses.includes("factcheck") && factCheckRow) {
              tasks.push(
                (async () => {
                  const seen = new Set(existingClaims.map(claimKey));
                  let claimCounter = highestClaimCounter(existingClaims);
                  const maxClaims = Math.max(
                    1,
                    Math.floor(settings?.["factcheck.maxClaims"] ?? 50),
                  );
                  try {
                    for await (const event of withModelFallback(
                      modelChain,
                      (model) =>
                        llm.extractClaimsStream(
                          {
                            sentences: toAnalyze,
                            lang,
                            contextSentences,
                            sourceUrl: capturedSourceUrl,
                            analysisConfig,
                          },
                          {
                            model,
                            signal: abortController.signal,
                            onUsage: (usage) => usages.push(usage),
                          },
                        ),
                      abortController.signal,
                      (model) => fallbackModels.push(model),
                    )) {
                      if (event.type === "language") {
                        windowLanguage ??= event.language;
                        continue;
                      }
                      if (
                        existingClaims.length + newClaims.length >=
                        maxClaims
                      ) {
                        break;
                      }
                      if (!isAnchoredToWindow(event.claim, toAnalyze)) continue;
                      const parsed = ClaimSchema.safeParse(event.claim);
                      if (!parsed.success) continue;
                      const key = claimKey(parsed.data);
                      if (seen.has(key)) continue;
                      seen.add(key);
                      const stored = {
                        id: `c${++claimCounter}`,
                        ...parsed.data,
                        ...(speakerAttribution ?? {}),
                      };
                      newClaims.push(stored);
                      // Make the individual verification action usable the
                      // instant the claim reaches the browser. Persist first
                      // so a fast click cannot race the end-of-window update
                      // and receive "Claim not found".
                      await prisma.factCheck.update({
                        where: { id: row.id },
                        data: {
                          claims: JSON.stringify([
                            ...existingClaims,
                            ...newClaims,
                          ]),
                        },
                      });
                      send("claim", stored);
                    }
                  } catch (err) {
                    sendLensError(
                      send,
                      "factcheck",
                      err,
                      abortController.signal,
                    );
                  }
                })(),
              );
            }

            if (
              (shouldAnalyze || shouldFinalizeNeutrality) &&
              lenses.includes("neutrality") &&
              neutralityRow
            ) {
              tasks.push(
                (async () => {
                  let finalResetSent = false;
                  const neutralitySentences = finalize
                    ? allSentences
                    : toAnalyze;
                  const seen = new Set(
                    finalize
                      ? []
                      : existingNeutralityFindings.map(neutralityFindingKey),
                  );
                  const beginFinalAssessment = () => {
                    if (!finalize || finalResetSent) return;
                    finalResetSent = true;
                    send("neutralityReset", {});
                  };
                  try {
                    for await (const event of withModelFallback(
                      modelChain,
                      (model) =>
                        llm.analyzeNeutralityStream(
                          {
                            sentences: neutralitySentences,
                            lang,
                            contextSentences: finalize ? [] : contextSentences,
                            analysisConfig,
                          },
                          {
                            model,
                            signal: abortController.signal,
                            onUsage: (usage) => usages.push(usage),
                          },
                        ),
                      abortController.signal,
                      (model) => fallbackModels.push(model),
                    )) {
                      if (event.type === "finding") {
                        if (
                          !isAnchoredToWindow(
                            event.finding,
                            neutralitySentences,
                          )
                        ) {
                          continue;
                        }
                        const parsed = NeutralityFindingSchema.safeParse(
                          event.finding,
                        );
                        if (!parsed.success) continue;
                        const key = neutralityFindingKey(parsed.data);
                        if (seen.has(key)) continue;
                        beginFinalAssessment();
                        seen.add(key);
                        const stored = {
                          ...parsed.data,
                          ...(speakerAttribution ?? {}),
                        };
                        newNeutralityFindings.push(stored);
                        send("neutralityFinding", stored);
                      } else if (event.type === "verdict") {
                        beginFinalAssessment();
                        if (finalize) finalNeutralityRecalculated = true;
                        windowNeutralityVerdict = event.verdict;
                        windowNeutralityConfidence = event.confidence;
                        windowNeutralityRationale = event.rationale;
                        send("neutralityVerdict", {
                          verdict: event.verdict,
                          confidence: event.confidence,
                          rationale: event.rationale,
                        });
                      } else if (event.type === "textType") {
                        windowTextType = event.textType;
                      } else if (event.type === "language") {
                        windowLanguage ??= event.language;
                      }
                    }
                  } catch (err) {
                    sendLensError(
                      send,
                      "neutrality",
                      err,
                      abortController.signal,
                    );
                  }
                })(),
              );
            }

            await Promise.all(tasks);

            const latestContextRevision = await prisma.analysis.findUnique({
              where: { id: row.id },
              select: { contextRevision: true, liveContext: true },
            });
            if (
              factCheckRow &&
              latestContextRevision &&
              latestContextRevision.contextRevision !== row.contextRevision
            ) {
              nextLiveContext = readLiveContext(
                latestContextRevision.liveContext,
              );
              const latestFactCheck = await prisma.factCheck.findUnique({
                where: { id: row.id },
                select: { claims: true },
              });
              existingClaims = safeJsonArray<ClaimWithId>(
                latestFactCheck?.claims ?? "[]",
              );
              const replacements = nextLiveContext.entities
                .filter((entity) => entity.userCorrectedName)
                .flatMap((entity) =>
                  entity.aliases.map((alias) => ({
                    from: alias,
                    to: entity.name,
                  })),
                );
              if (replacements.length > 0) {
                const corrected = replaceEntityNamesInClaims(
                  newClaims,
                  replacements,
                );
                newClaims.splice(0, newClaims.length, ...corrected);
              }
            }

            const replayEvents = [
              ...newFindings.map((finding) => ({
                kind: "finding_detected" as const,
                elapsedMs: captureElapsedMs,
                sentenceIds: finding.sentenceIds,
                payload: finding,
              })),
              ...newClaims.map((claim) => ({
                kind: "claim_detected" as const,
                elapsedMs: captureElapsedMs,
                sentenceIds: claim.sentenceIds,
                payload: claim,
              })),
              ...newNeutralityFindings.map((finding) => ({
                kind: "neutrality_finding_detected" as const,
                elapsedMs: captureElapsedMs,
                sentenceIds: finding.sentenceIds,
                payload: finding,
              })),
              ...(windowNeutralityVerdict
                ? [
                    {
                      kind: "neutrality_assessed" as const,
                      elapsedMs: captureElapsedMs,
                      sentenceIds: toAnalyze.flatMap(
                        (sentence) => sentence.id,
                      ),
                      payload: {
                        verdict: windowNeutralityVerdict,
                        confidence: windowNeutralityConfidence,
                        rationale: windowNeutralityRationale,
                      },
                    },
                  ]
                : []),
            ];
            try {
              await recordContextSessionEvents({
                analysisId: row.id,
                ownerWorkosUserId: row.ownerWorkosUserId,
                events: replayEvents,
              });
            } catch (eventError) {
              console.error("[live/analyze] replay events failed", eventError);
            }
          }

          await settle();

          // ── Persist ────────────────────────────────────────────────────
          // The committed sentence set grows by the count we analyzed (or by
          // all new sentences on finalize). Persist exactly what we've seen so
          // future calls can pick up from there.
          const persistedSentences = finalize
            ? allSentences
            : shouldAnalyze
              ? allSentences.slice(0, committedCount + toAnalyze.length)
              : allSentences.slice(0, committedCount);
          const allFindings = [...existingFindings, ...newFindings];
          let allClaims = [...existingClaims, ...newClaims];
          const allNeutralityFindings = finalize
            ? finalNeutralityRecalculated
              ? newNeutralityFindings
              : existingNeutralityFindings
            : [...existingNeutralityFindings, ...newNeutralityFindings];
          const neutrality = neutralityRow
            ? resolveLiveNeutrality(
                neutralityRow,
                {
                  verdict: windowNeutralityVerdict,
                  confidence: windowNeutralityConfidence,
                  rationale: windowNeutralityRationale,
                  textType: windowTextType,
                },
                finalize && finalNeutralityRecalculated,
              )
            : null;

          // On finalize, derive score from density and severity. Otherwise let
          // the window score nudge the running score for stability.
          const aggregateScore = finalize
            ? computeFinalScore(allFindings, text.length)
            : Math.round((row.score * 2 + windowScore) / 3);

          const aggregateSummary = windowSummary || row.summary || "";
          const title = finalize
            ? buildLiveAnalysisTitle({
                createdAt: row.createdAt,
                summary: aggregateSummary,
                transcript: text,
                language: windowLanguage ?? row.language ?? lang,
                timeZone: body.timeZone,
              })
            : row.title;

          const finishedAt = finalize ? new Date() : null;
          allClaims = await serializableTransaction(async (tx) => {
            let claimsToPersist = allClaims;
            const latestContext = await tx.analysis.findUnique({
              where: { id: row.id },
              select: { contextRevision: true, liveContext: true },
            });
            if (
              factCheckRow &&
              latestContext &&
              latestContext.contextRevision !== row.contextRevision
            ) {
              const latestFactCheck = await tx.factCheck.findUnique({
                where: { id: row.id },
                select: { claims: true },
              });
              const correctedContext = readLiveContext(
                latestContext.liveContext,
              );
              const replacements = correctedContext.entities
                .filter((entity) => entity.userCorrectedName)
                .flatMap((entity) =>
                  entity.aliases.map((alias) => ({
                    from: alias,
                    to: entity.name,
                  })),
                );
              const correctedNewClaims =
                replacements.length > 0
                  ? replaceEntityNamesInClaims(newClaims, replacements)
                  : newClaims;
              claimsToPersist = mergeClaimsById(
                safeJsonArray<ClaimWithId>(latestFactCheck?.claims ?? "[]"),
                correctedNewClaims,
              );
            }

            await tx.analysis.update({
              where: { id: row.id },
              data: {
                status: finalize ? "complete" : "running",
                sourceRef: capturedSourceUrl,
                text,
                transcript: text,
                sentences: JSON.stringify(persistedSentences),
                findings: JSON.stringify(allFindings),
                score: aggregateScore,
                title,
                summary: aggregateSummary || null,
                language: windowLanguage ?? row.language ?? lang,
                finishedAt,
                audioDurationMs,
              },
            });
            if (factCheckRow) {
              await tx.factCheck.update({
                where: { id: row.id },
                data: {
                  status: finalize ? "complete" : "running",
                  sourceRef: capturedSourceUrl,
                  text,
                  title,
                  language: windowLanguage ?? factCheckRow.language ?? lang,
                  sentences: JSON.stringify(persistedSentences),
                  claims: JSON.stringify(claimsToPersist),
                  finishedAt,
                },
              });
            }
            if (neutralityRow && neutrality) {
              await tx.neutrality.update({
                where: { id: row.id },
                data: {
                  status: finalize ? "complete" : "running",
                  sourceRef: capturedSourceUrl,
                  text,
                  title,
                  language: windowLanguage ?? neutralityRow.language ?? lang,
                  sentences: JSON.stringify(persistedSentences),
                  findings: JSON.stringify(allNeutralityFindings),
                  verdict: neutrality.verdict,
                  confidence: neutrality.confidence,
                  rationale: neutrality.rationale || null,
                  textType: neutrality.textType,
                  finishedAt,
                },
              });
            }
            return claimsToPersist;
          });

          send("done", {
            id: row.id,
            analyzed: shouldAnalyze,
            newFindings: newFindings.length,
            totalFindings: allFindings.length,
            newClaims: newClaims.length,
            totalClaims: allClaims.length,
            newNeutralityFindings: newNeutralityFindings.length,
            totalNeutralityFindings: allNeutralityFindings.length,
            neutralityFindings: allNeutralityFindings,
            ...(neutrality ? { neutrality } : {}),
            lenses,
            score: aggregateScore,
            title,
            finalize,
          });
          writer.close();
        } finally {
          permit?.release();
        }
      },
      async cancel() {
        sseWriter?.cancel();
        abortController.abort();
        try {
          await settle();
        } finally {
          permit?.release();
        }
      },
    });
  } catch (error) {
    permit?.release();
    throw error;
  }

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
      connection: "keep-alive",
    },
  });
}

// ── helpers ────────────────────────────────────────────────────────────

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function persistLiveContextWindow(input: {
  analysisId: string;
  expectedRevision: number;
  nextContext: LiveContext;
  analyzedWindow: LiveContextWindow;
}): Promise<{ context: LiveContext }> {
  let expectedRevision = input.expectedRevision;
  let nextContext = input.nextContext;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const updated = await prisma.analysis.updateMany({
      where: { id: input.analysisId, contextRevision: expectedRevision },
      data: { liveContext: JSON.stringify(nextContext) },
    });
    if (updated.count === 1) return { context: nextContext };

    const latest = await prisma.analysis.findUnique({
      where: { id: input.analysisId },
      select: { liveContext: true, contextRevision: true },
    });
    if (!latest) throw new Error("Context session disappeared");
    expectedRevision = latest.contextRevision;
    nextContext = mergeLiveContext(
      readLiveContext(latest.liveContext),
      input.analyzedWindow,
    );
  }

  throw new Error("Context changed repeatedly while analysis was running");
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

function mergeClaimsById(
  existing: ClaimWithId[],
  additions: ClaimWithId[],
): ClaimWithId[] {
  const claims = new Map(existing.map((claim) => [claim.id, claim]));
  for (const claim of additions) claims.set(claim.id, claim);
  return [...claims.values()];
}

function normalizeLang(v: unknown): Lang {
  const s = typeof v === "string" ? v.toLowerCase() : undefined;
  if (s === "en" || s === "pt" || s === "es") return s;
  return "en";
}

function safeJsonArray<T>(s: string): T[] {
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function findingKey(f: Finding): string {
  return `${[...f.sentenceIds].sort().join(",")}::${f.fallacy}`;
}

function claimKey(claim: Claim): string {
  return claim.statement.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function highestClaimCounter(claims: ClaimWithId[]): number {
  return claims.reduce((highest, claim) => {
    const match = /^c(\d+)$/.exec(claim.id);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
}

function neutralityFindingKey(finding: NeutralityFinding): string {
  return `${[...finding.sentenceIds].sort().join(",")}::${finding.issue}`;
}

function contextSentenceIds(context: LiveContext): string[] {
  return Array.from(
    new Set([
      ...context.tags.flatMap((tag) => tag.sentenceIds),
      ...context.topics.flatMap((topic) => topic.sentenceIds),
      ...context.terms.flatMap((term) => term.sentenceIds),
      ...context.entities.flatMap((entity) => entity.sentenceIds),
      ...context.relations.flatMap((relation) => relation.sentenceIds),
      ...context.segments.flatMap((segment) => segment.sentenceIds),
    ]),
  );
}

function isAnchoredToWindow(
  value: { sentenceIds: string[] },
  sentences: Sentence[],
): boolean {
  const ids = new Set(sentences.map((sentence) => sentence.id));
  return value.sentenceIds.every((id) => ids.has(id));
}

type SendEvent = (event: string, data: unknown) => void;

function sendLensError(
  send: SendEvent,
  lens: LiveLens,
  error: unknown,
  signal: AbortSignal,
) {
  if (signal.aborted) return;
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[live/analyze] ${lens} error`, error);
  send("lensError", { lens, error: message });
}

async function deleteLiveRows(id: string): Promise<void> {
  await prisma.$transaction([
    prisma.factCheck.deleteMany({ where: { id } }),
    prisma.neutrality.deleteMany({ where: { id } }),
    prisma.analysis.deleteMany({ where: { id } }),
  ]);
}

/**
 * Returns how many of `existing` still match `current` from the start,
 * by sentence text identity. Use this to detect which previously-stored
 * sentences are still "the same" sentence after a re-split (the trailing
 * partial can absorb new text and change between calls).
 */
function countMatchingPrefix(
  existing: Sentence[],
  current: Sentence[],
): number {
  const max = Math.min(existing.length, current.length);
  let i = 0;
  while (i < max && existing[i].text === current[i].text) i++;
  return i;
}

/**
 * Convert a finding set into a 0–100 score. Density-aware so that 2 findings
 * in 5000 chars feels different from 2 findings in 200 chars.
 */
function computeFinalScore(findings: Finding[], chars: number): number {
  if (findings.length === 0) return Math.min(15, Math.round(chars / 1000));
  const severityWeight = findings.reduce(
    (acc, f) => acc + (f.severity === "high" ? 8 : 4),
    0,
  );
  const per1k = (severityWeight * 1000) / Math.max(chars, 500);
  return Math.max(20, Math.min(100, Math.round(20 + per1k * 4)));
}
