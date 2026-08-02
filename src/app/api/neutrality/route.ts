import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { ingestUrl } from "@/lib/ingest/url";
import { ingestAnalysisFile } from "@/lib/ingest/file";
import { ingestText } from "@/lib/ingest/text";
import { splitSentences } from "@/lib/sentences";
import { chunkSentences } from "@/lib/chunker";
import { getProvider, resolveModel } from "@/lib/llm";
import { DEFAULT_MODEL_CHAIN, withModelFallback } from "@/lib/llm/fallback";
import { consume, ipFromRequest, rateLimitResponse } from "@/lib/rate-limit";
import { bucketFromSettings, loadSettings } from "@/lib/settings";
import type { IngestedDocument } from "@/lib/ingest/url";
import { IngestError } from "@/lib/ingest/errors";
import type { NeutralityFinding } from "@/lib/neutrality-schema";
import type { Lang } from "@/lib/fallacies";
import {
  isAccessResponse,
  requireWebAnalysisAccess,
} from "@/lib/web-analysis-access";
import {
  createWebAnalysisUsageSettlement,
  isCreditResponse,
  reserveWebAnalysisCredits,
} from "@/lib/web-credit-billing";
import {
  maxCreditsForCalls,
} from "@/lib/jiddu-credit-rates";
import type { OpenRouterUsage } from "@/lib/openrouter-usage";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_TEXT_CHARS = 200_000;
const CHUNK_CONCURRENCY = 4;
const MAX_TITLE_CHARS = 500;
const MAX_SOURCE_REF_CHARS = 2_000;

export async function POST(req: NextRequest) {
  const access = await requireWebAnalysisAccess();
  if (isAccessResponse(access)) return access;

  const settings = await loadSettings();
  // Neutrality is cost-equivalent to fallacy detection (one LLM call per
  // chunk, no Sonar search). Same rate-limit bucket as analyze.
  const rl = consume(
    `neutrality:${ipFromRequest(req)}`,
    bucketFromSettings(settings, "rate.analyze"),
  );
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

  let doc: IngestedDocument;
  let modelId: string | undefined;
  let lang: Lang = "en";
  const id = nanoid(10);

  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      modelId = normalizeString(form.get("model"));
      lang = normalizeLang(form.get("lang"));
      const file = form.get("file");
      if (!(file instanceof File)) return jsonError("Missing 'file' field", 400);
      const ingested = await ingestAnalysisFile(file, {
        access,
        feature: "neutrality",
        resourceId: id,
        modelId,
        lang,
        signal: req.signal,
      });
      if (ingested instanceof Response) return ingested;
      doc = ingested;
    } else {
      const body = (await req.json().catch(() => null)) as
        | { type?: string; url?: string; text?: string; model?: string; title?: string; lang?: string }
        | null;
      if (!body) return jsonError("Invalid JSON", 400);
      modelId = body.model ?? undefined;
      lang = normalizeLang(body.lang);
      if (body.type === "url" && body.url) {
        doc = await ingestUrl(body.url);
      } else if (body.type === "text" && body.text) {
        doc = ingestText(body.text, { title: body.title });
      } else {
        return jsonError("Provide { type:'url', url } or { type:'text', text }", 400);
      }
    }
  } catch (err) {
    if (err instanceof IngestError) {
      return new Response(
        JSON.stringify({ error: err.message, code: err.code }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }
    return jsonError(err instanceof Error ? err.message : "Ingestion failed", 400);
  }

  if (doc.text.length > MAX_TEXT_CHARS) {
    doc = { ...doc, text: doc.text.slice(0, MAX_TEXT_CHARS) };
  }

  const sentences = splitSentences(doc.text);
  if (sentences.length === 0) return jsonError("No sentences detected", 422);

  const modelChain: string[] = modelId
    ? Array.from(new Set([resolveModel(modelId).id, ...DEFAULT_MODEL_CHAIN]))
    : [...DEFAULT_MODEL_CHAIN];

  let llm;
  try {
    llm = getProvider(modelChain[0], access.apiKey);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Provider error", 400);
  }

  const chunks = chunkSentences(sentences);
  const creditReservation = await reserveWebAnalysisCredits(access, {
    amount: maxCreditsForCalls(modelChain, chunks.length),
    feature: "neutrality",
    resourceId: id,
    metadata: { modelChain, chunkCount: chunks.length },
  });
  if (isCreditResponse(creditReservation)) return creditReservation;
  const billableModels: string[] = [];
  const usages: OpenRouterUsage[] = [];
  const settleUsage = createWebAnalysisUsageSettlement(
    access,
    creditReservation,
    {
      feature: "neutrality",
      resourceId: id,
      metadata: { modelChain, chunkCount: chunks.length },
    },
  );

  await prisma.neutrality.create({
    data: {
      id,
      ownerWorkosUserId: access.userId ?? null,
      status: "running",
      source: doc.source,
      sourceRef: cap(doc.sourceRef, MAX_SOURCE_REF_CHARS),
      title: doc.title ? cap(doc.title, MAX_TITLE_CHARS) : null,
      text: doc.text,
      language: lang,
      provider: llm.id,
      model: llm.defaultModel,
      sentences: JSON.stringify(sentences),
      findings: JSON.stringify([]),
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
        title: doc.title,
        source: doc.source,
        sourceRef: doc.sourceRef,
        sentences,
        provider: llm.id,
        model: llm.defaultModel,
        chunkCount: chunks.length,
      });

      // Per-chunk results aggregate to a final document-level verdict.
      // We keep the strongest verdict and the highest-confidence rationale.
      const allFindings: NeutralityFinding[] = [];
      const chunkResults: {
        verdict: string;
        confidence: number;
        rationale: string;
        textType: string;
        chars: number;
      }[] = [];
      const chunkErrors: { index: number; message: string }[] = [];

      let cursor = 0;
      const workers: Promise<void>[] = [];
      const launch = async () => {
        while (true) {
          const idx = cursor++;
          if (idx >= chunks.length) return;
          const chunk = chunks[idx];
          let chunkVerdict = "neutral";
          let chunkConfidence = 0;
          let chunkRationale = "";
          let chunkTextType = "informational";
          send("chunkStart", {
            index: chunk.index,
            sentenceIds: chunk.sentences.map((s) => s.id),
          });
          try {
            for await (const event of withModelFallback(
              modelChain,
              (model) =>
                llm.analyzeNeutralityStream(
                  { sentences: chunk.sentences, lang },
                  {
                    model,
                    signal: abortController.signal,
                    onUsage: (usage) => usages.push(usage),
                  },
                ),
              abortController.signal,
              (model) => billableModels.push(model),
            )) {
              if (event.type === "finding") {
                allFindings.push(event.finding);
                send("finding", event.finding);
              } else if (event.type === "verdict") {
                chunkVerdict = event.verdict;
                chunkConfidence = event.confidence;
                chunkRationale = event.rationale;
              } else if (event.type === "textType") {
                chunkTextType = event.textType;
              }
            }
            chunkResults.push({
              verdict: chunkVerdict,
              confidence: chunkConfidence,
              rationale: chunkRationale,
              textType: chunkTextType,
              chars: chunk.chars,
            });
            send("chunkDone", { index: chunk.index });
          } catch (err) {
            if (abortController.signal.aborted) return;
            const message = err instanceof Error ? err.message : String(err);
            console.error(`[/api/neutrality] chunk ${chunk.index} failed:`, err);
            chunkErrors.push({ index: chunk.index, message });
            send("chunkError", { index: chunk.index, message });
            send("chunkDone", { index: chunk.index });
          }
        }
      };
      for (let i = 0; i < Math.min(CHUNK_CONCURRENCY, chunks.length); i++) {
        workers.push(launch());
      }
      await Promise.all(workers);

      if (chunkResults.length === 0 && chunkErrors.length > 0) {
        const message = chunkErrors.map((e) => e.message).join(" / ");
        await prisma.neutrality.update({
          where: { id },
          data: { status: "failed", errorMessage: message, finishedAt: new Date() },
        });
        await settleUsage({
          usages,
          fallbackModels: billableModels,
          metadata: { models: billableModels, completedChunks: 0 },
        });
        send("error", { error: message });
        controller.close();
        return;
      }

      // Aggregate: pick the "worst" verdict any chunk reported
      // (manipulation > explicitly_partisan > partisan_lean > neutral). Use
      // the highest-confidence rationale from chunks at that level.
      const RANK = {
        neutral: 0,
        partisan_lean: 1,
        explicitly_partisan: 2,
        manipulation: 3,
      } as const;
      type V = keyof typeof RANK;
      const finalVerdict = (chunkResults
        .map((c) => c.verdict as V)
        .reduce((acc, v) => (RANK[v] > RANK[acc] ? v : acc), "neutral" as V) as V) ?? "neutral";
      const finalConfidence =
        chunkResults
          .filter((c) => c.verdict === finalVerdict)
          .reduce((a, b) => Math.max(a, b.confidence), 0) ||
        chunkResults.reduce((a, b) => Math.max(a, b.confidence), 0);
      const finalRationale =
        chunkResults
          .filter((c) => c.verdict === finalVerdict && c.rationale.length > 0)
          .sort((a, b) => b.confidence - a.confidence)[0]?.rationale ?? "";
      // Most common textType across chunks (informational by default).
      const typeCounts = new Map<string, number>();
      for (const c of chunkResults) {
        typeCounts.set(c.textType, (typeCounts.get(c.textType) ?? 0) + 1);
      }
      const finalTextType = [...typeCounts.entries()].sort(
        (a, b) => b[1] - a[1],
      )[0]?.[0] ?? "informational";

      await prisma.neutrality.update({
        where: { id },
        data: {
          status: "complete",
          verdict: finalVerdict,
          confidence: finalConfidence,
          rationale: finalRationale,
          textType: finalTextType,
          findings: JSON.stringify(allFindings),
          finishedAt: new Date(),
        },
      });
      await settleUsage({
        usages,
        fallbackModels: billableModels,
        metadata: {
          models: billableModels,
          completedChunks: chunkResults.length,
        },
      });

      send("done", {
        id,
        verdict: finalVerdict,
        confidence: finalConfidence,
        rationale: finalRationale,
        textType: finalTextType,
        findingsCount: allFindings.length,
      });
      controller.close();
    },
    async cancel() {
      abortController.abort();
      await settleUsage({
        usages,
        fallbackModels: billableModels,
        note: "Client disconnected before completion.",
        metadata: { models: billableModels },
      });
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

function normalizeString(v: FormDataEntryValue | string | undefined | null): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s.length > 0 ? s : undefined;
}

function normalizeLang(v: FormDataEntryValue | string | undefined | null): Lang {
  const s = typeof v === "string" ? v.toLowerCase() : undefined;
  if (s === "en" || s === "pt" || s === "es") return s;
  return "en";
}

function cap(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) : s;
}
