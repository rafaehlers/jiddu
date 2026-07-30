import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { splitSentences } from "@/lib/sentences";
import { getProvider, resolveModel } from "@/lib/llm";
import { FindingSchema, type Finding, type Sentence } from "@/lib/schema";
import type { Lang } from "@/lib/fallacies";
import {
  isAccessResponse,
  requireWebAnalysisAccess,
} from "@/lib/web-analysis-access";
import { modelCreditRate } from "@/lib/jiddu-credit-rates";
import {
  recordIncludedJidduCreditUsage,
  settleJidduCreditReservationFromUsage,
} from "@/lib/jiddu-credits";
import {
  isCreditResponse,
  reserveWebAnalysisCredits,
} from "@/lib/web-credit-billing";
import type { OpenRouterUsage } from "@/lib/openrouter-usage";
import { buildLiveAnalysisTitle } from "@/lib/live-title";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TRANSCRIPT_CHARS = 500_000;
const MIN_NEW_CHARS_TO_ANALYZE = 80;
const CONTEXT_SENTENCE_COUNT = 4;

type Body = {
  sessionId?: string;
  text?: string;
  lang?: string;
  model?: string;
  timeZone?: string;
  finalize?: boolean;
};

export async function POST(req: NextRequest) {
  const access = await requireWebAnalysisAccess();
  if (isAccessResponse(access)) return access;

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return jsonError("Invalid JSON", 400);

  const text = typeof body.text === "string" ? body.text : "";
  const lang = normalizeLang(body.lang);
  const finalize = body.finalize === true;

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

  // ── Provider setup ───────────────────────────────────────────────────
  const chosenModel = resolveModel(body.model ?? row.model);
  let llm;
  try {
    llm = getProvider(chosenModel.id, access.apiKey);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Provider error", 400);
  }

  const reservation = shouldAnalyze
    ? await reserveWebAnalysisCredits(access, {
        amount: modelCreditRate(chosenModel.id),
        feature: "live_analysis",
        resourceId: row.id,
        metadata: { model: chosenModel.id },
      })
    : null;
  if (reservation && isCreditResponse(reservation)) {
    if (isNew) {
      await prisma.analysis.delete({ where: { id: row.id } });
    }
    return reservation;
  }

  // ── Stream ───────────────────────────────────────────────────────────
  const encoder = new TextEncoder();
  const abortController = new AbortController();
  let billableModelCall = false;
  const usages: OpenRouterUsage[] = [];
  let settled = false;
  const settle = async () => {
    if (settled) return;
    settled = true;
    const settlement = await settleJidduCreditReservationFromUsage(
      reservation,
      {
        usages,
        fallbackModels: billableModelCall ? [chosenModel.id] : [],
        resourceId: row.id,
        metadata: { model: chosenModel.id },
      },
    );
    if (
      access.billing === "platform" &&
      billableModelCall &&
      access.userId &&
      access.email
    ) {
      await recordIncludedJidduCreditUsage({
        workosUserId: access.userId,
        email: access.email,
        feature: "live_analysis",
        resourceId: row.id,
        note: "Included platform access",
        metadata: { model: chosenModel.id },
        usage: settlement,
      });
    }
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      if (isNew) {
        send("meta", { id: row.id, model: row.model, provider: row.provider });
      }

      const newFindings: Finding[] = [];
      let windowScore = 0;
      let windowSummary = "";
      let windowLanguage: string | null = null;

      if (shouldAnalyze) {
        // Build a dedupe key set from existing findings.
        const seen = new Set<string>(existingFindings.map(findingKey));

        try {
          for await (const event of llm.analyzeStream(
            { sentences: toAnalyze, lang, contextSentences },
            {
              signal: abortController.signal,
              onUsage: (usage) => usages.push(usage),
            },
          )) {
            billableModelCall = true;
            if (event.type === "finding") {
              // Guard: drop findings the model wrongly anchored to context
              // sentences or to ids we don't recognize.
              const ok = event.finding.sentenceIds.every((id) =>
                toAnalyze.some((s) => s.id === id),
              );
              if (!ok) continue;
              const key = findingKey(event.finding);
              if (seen.has(key)) continue;
              seen.add(key);
              const parsed = FindingSchema.safeParse(event.finding);
              if (!parsed.success) continue;
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
          if (!abortController.signal.aborted) {
            const message = err instanceof Error ? err.message : String(err);
            console.error("[live/analyze] LLM error", err);
            send("error", { error: message });
          }
        }
      }
      await settle();

      // ── Persist ──────────────────────────────────────────────────────
      // The committed sentence set grows by the count we actually analyzed
      // (or by all new sentences on finalize). Either way, persist exactly
      // what we've seen so future calls can pick up from there.
      const persistedSentences = finalize
        ? allSentences
        : shouldAnalyze
          ? allSentences.slice(0, committedCount + toAnalyze.length)
          : allSentences.slice(0, committedCount);
      const allFindings = [...existingFindings, ...newFindings];

      // Recompute score: on finalize, derive from density + severity.
      // Otherwise let windowScore nudge the running score (weighted toward
      // existing for stability).
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

      await prisma.analysis.update({
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
          finishedAt: finalize ? new Date() : null,
        },
      });

      send("done", {
        id: row.id,
        analyzed: shouldAnalyze,
        newFindings: newFindings.length,
        totalFindings: allFindings.length,
        score: aggregateScore,
        title,
        finalize,
      });
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
