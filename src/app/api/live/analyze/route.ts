import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { splitSentences } from "@/lib/sentences";
import { getProvider, resolveModel } from "@/lib/llm";
import { FindingSchema, type Finding, type Sentence } from "@/lib/schema";
import { ClaimSchema, type Claim } from "@/lib/claims-schema";
import {
  NEUTRALITY_VERDICTS,
  NeutralityFindingSchema,
  TEXT_TYPES,
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
import {
  normalizeLiveLenses,
  type LiveLens,
} from "@/lib/live-lenses";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TRANSCRIPT_CHARS = 500_000;
const MIN_NEW_CHARS_TO_ANALYZE = 80;
const CONTEXT_SENTENCE_COUNT = 4;

type Body = {
  billingReservationId?: string;
  sessionId?: string;
  text?: string;
  lang?: string;
  model?: string;
  lenses?: string[];
  timeZone?: string;
  finalize?: boolean;
  audioDurationMs?: number;
};

type ClaimWithId = Claim & { id: string };

export async function POST(req: NextRequest) {
  const access = await requireWebAnalysisAccess();
  if (isAccessResponse(access)) return access;

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return jsonError("Invalid JSON", 400);

  const text = typeof body.text === "string" ? body.text : "";
  const lang = normalizeLang(body.lang);
  const lenses = normalizeLiveLenses(body.lenses);
  const finalize = body.finalize === true;
  const billingReservationId =
    typeof body.billingReservationId === "string"
      ? body.billingReservationId.trim()
      : "";
  const audioDurationMs = finalize
    ? normalizeLiveDurationMs(body.audioDurationMs)
    : undefined;

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
    if (
      access.userId &&
      row.ownerWorkosUserId !== access.userId
    ) {
      return jsonError("Session not found", 404);
    }
    if (row.source !== "live") return jsonError("Not a live session", 400);
    if (row.status === "complete" || row.status === "failed") {
      return jsonError(`Session already ${row.status}`, 409);
    }
  } else {
    const chosenModel = resolveModel(body.model);
    let llm;
    try {
      llm = getProvider(chosenModel.id, access.apiKey);
    } catch (err) {
      return jsonError(err instanceof Error ? err.message : "Provider error", 400);
    }
    const id = nanoid(10);
    row = await prisma.analysis.create({
      data: {
        id,
        ownerWorkosUserId: access.userId ?? null,
        status: "running",
        source: "live",
        sourceRef: null,
        title: null,
        text: "",
        transcript: "",
        language: lang,
        provider: llm.id,
        model: llm.defaultModel,
        score: 0,
        summary: null,
        sentences: JSON.stringify([]),
        findings: JSON.stringify([]),
      },
    });
    isNew = true;
  }

  // ── Compute what's new and worth analyzing ───────────────────────────
  const existingSentences = safeJsonArray<Sentence>(row.sentences);
  const existingFindings = safeJsonArray<Finding>(row.findings);

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
    toAnalyze.length > 0 && (finalize || newCharCount >= MIN_NEW_CHARS_TO_ANALYZE);

  const contextSentences = existingSentences.slice(-CONTEXT_SENTENCE_COUNT);

  const identity = access.userId ?? access.email ?? "unknown";
  const settings = shouldAnalyze ? await loadSettings() : null;
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

  const permit = shouldAnalyze
    ? acquireConcurrency(`live:analyze:${identity}`, 1)
    : null;
  if (shouldAnalyze && !permit) {
    if (isNew) {
      await prisma.analysis.delete({ where: { id: row.id } });
    }
    return rateLimitResponse(1);
  }

  // ── Provider setup ───────────────────────────────────────────────────
  const chosenModel = resolveModel(body.model ?? row.model);
  let llm;
  try {
    llm = getProvider(chosenModel.id, access.apiKey);
  } catch (err) {
    permit?.release();
    return jsonError(err instanceof Error ? err.message : "Provider error", 400);
  }

  let reservation: JidduCreditReservationHandle | null | Response;
  try {
    reservation = shouldAnalyze
      ? await reserveWebAnalysisCredits(access, {
          amount: maxCreditsForCalls([chosenModel.id], lenses.length),
          feature: "live_analysis",
          resourceId: row.id,
          metadata: { model: chosenModel.id, lenses },
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

  let factCheckRow: Awaited<
    ReturnType<typeof prisma.factCheck.findUnique>
  > = null;
  let neutralityRow: Awaited<
    ReturnType<typeof prisma.neutrality.findUnique>
  > = null;
  try {
    [factCheckRow, neutralityRow] = await Promise.all([
      lenses.includes("factcheck")
        ? prisma.factCheck.upsert({
            where: { id: row.id },
            update: {},
            create: {
              id: row.id,
              ownerWorkosUserId: row.ownerWorkosUserId,
              status: "running",
              source: "live",
              sourceRef: null,
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
            update: {},
            create: {
              id: row.id,
              ownerWorkosUserId: row.ownerWorkosUserId,
              status: "running",
              source: "live",
              sourceRef: null,
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

  const existingClaims = safeJsonArray<ClaimWithId>(factCheckRow?.claims ?? "[]");
  const existingNeutralityFindings = safeJsonArray<NeutralityFinding>(
    neutralityRow?.findings ?? "[]",
  );

  // ── Stream ───────────────────────────────────────────────────────────
  const encoder = new TextEncoder();
  const abortController = new AbortController();
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
          billingReservationId &&
          access.billing === "jiddu" &&
          access.userId
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
          const send = (event: string, data: unknown) => {
            controller.enqueue(
              encoder.encode(
                `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
              ),
            );
          };

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
          let windowScore = 0;
          let windowSummary = "";
          let windowLanguage: string | null = null;
          let windowNeutralityVerdict: NeutralityVerdictValue | null = null;
          let windowNeutralityConfidence = 0;
          let windowNeutralityRationale = "";
          let windowTextType: TextType | null = null;

          if (shouldAnalyze) {
            const tasks: Promise<void>[] = [];

            if (lenses.includes("fallacy")) {
              tasks.push(
                (async () => {
                  let observedModelOutput = false;
                  const seen = new Set<string>(
                    existingFindings.map(findingKey),
                  );
                  try {
                    for await (const event of llm.analyzeStream(
                      { sentences: toAnalyze, lang, contextSentences },
                      {
                        signal: abortController.signal,
                        onUsage: (usage) => usages.push(usage),
                      },
                    )) {
                      if (!observedModelOutput) {
                        fallbackModels.push(chosenModel.id);
                        observedModelOutput = true;
                      }
                      if (event.type === "finding") {
                        if (!isAnchoredToWindow(event.finding, toAnalyze)) {
                          continue;
                        }
                        const key = findingKey(event.finding);
                        if (seen.has(key)) continue;
                        const parsed = FindingSchema.safeParse(event.finding);
                        if (!parsed.success) continue;
                        seen.add(key);
                        newFindings.push(parsed.data);
                        send("finding", parsed.data);
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

            if (lenses.includes("factcheck") && factCheckRow) {
              tasks.push(
                (async () => {
                  let observedModelOutput = false;
                  const seen = new Set(existingClaims.map(claimKey));
                  let claimCounter = highestClaimCounter(existingClaims);
                  const maxClaims = Math.max(
                    1,
                    Math.floor(settings?.["factcheck.maxClaims"] ?? 50),
                  );
                  try {
                    for await (const event of llm.extractClaimsStream(
                      { sentences: toAnalyze, lang, contextSentences },
                      {
                        signal: abortController.signal,
                        onUsage: (usage) => usages.push(usage),
                      },
                    )) {
                      if (!observedModelOutput) {
                        fallbackModels.push(chosenModel.id);
                        observedModelOutput = true;
                      }
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
                      };
                      newClaims.push(stored);
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

            if (lenses.includes("neutrality") && neutralityRow) {
              tasks.push(
                (async () => {
                  let observedModelOutput = false;
                  const seen = new Set(
                    existingNeutralityFindings.map(neutralityFindingKey),
                  );
                  try {
                    for await (const event of llm.analyzeNeutralityStream(
                      { sentences: toAnalyze, lang, contextSentences },
                      {
                        signal: abortController.signal,
                        onUsage: (usage) => usages.push(usage),
                      },
                    )) {
                      if (!observedModelOutput) {
                        fallbackModels.push(chosenModel.id);
                        observedModelOutput = true;
                      }
                      if (event.type === "finding") {
                        if (!isAnchoredToWindow(event.finding, toAnalyze)) {
                          continue;
                        }
                        const parsed = NeutralityFindingSchema.safeParse(
                          event.finding,
                        );
                        if (!parsed.success) continue;
                        const key = neutralityFindingKey(parsed.data);
                        if (seen.has(key)) continue;
                        seen.add(key);
                        newNeutralityFindings.push(parsed.data);
                        send("neutralityFinding", parsed.data);
                      } else if (event.type === "verdict") {
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
          const allClaims = [...existingClaims, ...newClaims];
          const allNeutralityFindings = [
            ...existingNeutralityFindings,
            ...newNeutralityFindings,
          ];
          const neutrality = mergeNeutralityVerdict(
            neutralityRow,
            {
              verdict: windowNeutralityVerdict,
              confidence: windowNeutralityConfidence,
              rationale: windowNeutralityRationale,
              textType: windowTextType,
            },
          );

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
          await Promise.all([
            prisma.analysis.update({
              where: { id: row.id },
              data: {
                status: finalize ? "complete" : "running",
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
            }),
            factCheckRow
              ? prisma.factCheck.update({
                  where: { id: row.id },
                  data: {
                    status: finalize ? "complete" : "running",
                    text,
                    title,
                    language: windowLanguage ?? factCheckRow.language ?? lang,
                    sentences: JSON.stringify(persistedSentences),
                    claims: JSON.stringify(allClaims),
                    finishedAt,
                  },
                })
              : Promise.resolve(),
            neutralityRow
              ? prisma.neutrality.update({
                  where: { id: row.id },
                  data: {
                    status: finalize ? "complete" : "running",
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
                })
              : Promise.resolve(),
          ]);

          send("done", {
            id: row.id,
            analyzed: shouldAnalyze,
            newFindings: newFindings.length,
            totalFindings: allFindings.length,
            newClaims: newClaims.length,
            totalClaims: allClaims.length,
            newNeutralityFindings: newNeutralityFindings.length,
            totalNeutralityFindings: allNeutralityFindings.length,
            neutrality,
            lenses,
            score: aggregateScore,
            title,
            finalize,
          });
          controller.close();
        } finally {
          permit?.release();
        }
      },
      async cancel() {
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

const NEUTRALITY_RANK: Record<NeutralityVerdictValue, number> = {
  neutral: 0,
  partisan_lean: 1,
  explicitly_partisan: 2,
  manipulation: 3,
};

function mergeNeutralityVerdict(
  current:
    | {
        verdict: string;
        confidence: number;
        rationale: string | null;
        textType: string | null;
      }
    | null,
  window: {
    verdict: NeutralityVerdictValue | null;
    confidence: number;
    rationale: string;
    textType: TextType | null;
  },
): {
  verdict: NeutralityVerdictValue;
  confidence: number;
  rationale: string;
  textType: TextType;
} {
  const currentVerdict = normalizeNeutralityVerdict(current?.verdict);
  const useWindow =
    window.verdict !== null &&
    (current?.verdict === "pending" ||
      NEUTRALITY_RANK[window.verdict] > NEUTRALITY_RANK[currentVerdict] ||
      (window.verdict === currentVerdict &&
        window.confidence >= (current?.confidence ?? 0)));

  return {
    verdict: useWindow ? window.verdict! : currentVerdict,
    confidence: useWindow
      ? window.confidence
      : Math.max(0, current?.confidence ?? 0),
    rationale: useWindow
      ? window.rationale
      : current?.rationale ?? window.rationale,
    textType: window.textType ?? normalizeTextType(current?.textType),
  };
}

function normalizeNeutralityVerdict(value: unknown): NeutralityVerdictValue {
  return NEUTRALITY_VERDICTS.includes(value as NeutralityVerdictValue)
    ? (value as NeutralityVerdictValue)
    : "neutral";
}

function normalizeTextType(value: unknown): TextType {
  return TEXT_TYPES.includes(value as TextType)
    ? (value as TextType)
    : "informational";
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
function countMatchingPrefix(existing: Sentence[], current: Sentence[]): number {
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
