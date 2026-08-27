import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { ingestUrl } from "@/lib/ingest/url";
import { ingestAnalysisFile } from "@/lib/ingest/file";
import { ingestText } from "@/lib/ingest/text";
import { prepareAnalysisDocument } from "@/lib/analysis-document";
import { chunkSentences } from "@/lib/chunker";
import { getProvider } from "@/lib/llm";
import { withModelFallback } from "@/lib/llm/fallback";
import { loadAnalysisRouting } from "@/lib/analysis-routing";
import { consume, ipFromRequest, rateLimitResponse } from "@/lib/rate-limit";
import { bucketFromSettings, loadSettings } from "@/lib/settings";
import type { IngestedDocument } from "@/lib/ingest/url";
import { IngestError } from "@/lib/ingest/errors";
import type { SlopFinding } from "@/lib/slop-schema";
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
import {
  ANALYSIS_STREAM_DISCONNECTED_ERROR,
  createServerSseWriter,
  type ServerSseWriter,
} from "@/lib/server-sse";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_TEXT_CHARS = 200_000;
const CHUNK_CONCURRENCY = 4;
const MAX_TITLE_CHARS = 500;
const MAX_SOURCE_REF_CHARS = 2_000;

// Mirrors /api/analyze (the fallacy detector) — same ingest, chunking, model
// fallback and char-weighted score aggregation — running the slop-pattern
// prompt instead and persisting to the SlopCheck table.
export async function POST(req: NextRequest) {
  const access = await requireWebAnalysisAccess();
  if (isAccessResponse(access)) return access;

  const [settings, analysisRouting] = await Promise.all([
    loadSettings(),
    loadAnalysisRouting(),
  ]);
  // Cost-equivalent to fallacy detection (one LLM call per chunk, no web
  // search), so it shares the analyze rate bucket — same as neutrality.
  const rl = consume(
    `slop:${ipFromRequest(req)}`,
    bucketFromSettings(settings, "rate.analyze"),
  );
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

  let doc: IngestedDocument;
  let lang: Lang = "en";
  const id = nanoid(10);

  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      lang = normalizeLang(form.get("lang"));
      const file = form.get("file");
      if (!(file instanceof File)) return jsonError("Missing 'file' field", 400);
      const ingested = await ingestAnalysisFile(file, {
        access,
        feature: "slop",
        resourceId: id,
        routing: analysisRouting,
        lang,
        signal: req.signal,
      });
      if (ingested instanceof Response) return ingested;
      doc = ingested;
    } else {
      const body = (await req.json().catch(() => null)) as
        | { type?: string; url?: string; text?: string; title?: string; lang?: string }
        | null;
      if (!body) return jsonError("Invalid JSON", 400);
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

  const preparedDocument = prepareAnalysisDocument(doc, MAX_TEXT_CHARS);
  doc = { ...doc, text: preparedDocument.text };
  const { blocks, sentences } = preparedDocument;
  if (sentences.length === 0) return jsonError("No sentences detected", 422);

  const modelChain = analysisRouting.modelChain;

  let llm;
  try {
    llm = getProvider(
      modelChain[0],
      access.apiKey,
      analysisRouting.providerRoutingByModel,
    );
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Provider error", 400);
  }

  const chunks = chunkSentences(sentences);
  const creditReservation = await reserveWebAnalysisCredits(access, {
    amount: maxCreditsForCalls(modelChain, chunks.length),
    feature: "slop",
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
      feature: "slop",
      resourceId: id,
      metadata: { modelChain, chunkCount: chunks.length },
    },
  );

  await prisma.slopCheck.create({
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
      score: 0,
      summary: null,
      blocks: JSON.stringify(blocks),
      sentences: JSON.stringify(sentences),
      findings: JSON.stringify([]),
    },
  });

  const abortController = new AbortController();
  let clientDisconnected = false;
  let sseWriter: ServerSseWriter | null = null;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const writer = createServerSseWriter(controller);
      sseWriter = writer;
      const send = writer.send;

      send("meta", {
        id,
        title: doc.title,
        source: doc.source,
        sourceRef: doc.sourceRef,
        editorialMetadata: doc.editorial?.metadata ?? null,
        blocks,
        sentences,
        provider: llm.id,
        model: llm.defaultModel,
        chunkCount: chunks.length,
      });

      const allFindings: SlopFinding[] = [];
      const chunkResults: { score: number; summary: string; chars: number; language: string | null }[] = [];
      const chunkErrors: { index: number; message: string }[] = [];

      let cursor = 0;
      const workers: Promise<void>[] = [];
      const launch = async () => {
        while (true) {
          const idx = cursor++;
          if (idx >= chunks.length) return;
          const chunk = chunks[idx];
          let chunkScore = 0;
          let chunkSummary = "";
          let chunkLanguage: string | null = null;
          send("chunkStart", {
            index: chunk.index,
            sentenceIds: chunk.sentences.map((s) => s.id),
          });
          try {
            for await (const event of withModelFallback(
              modelChain,
              (model) =>
                llm.analyzeSlopStream(
                  {
                    sentences: chunk.sentences,
                    lang,
                    documentMetadata: doc.editorial?.metadata,
                  },
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
              } else if (event.type === "summary") {
                chunkSummary = event.summary;
              } else if (event.type === "score") {
                chunkScore = event.score;
              } else if (event.type === "language") {
                chunkLanguage = event.language;
              }
            }
            chunkResults.push({
              score: chunkScore,
              summary: chunkSummary,
              chars: chunk.chars,
              language: chunkLanguage,
            });
            send("chunkDone", { index: chunk.index });
          } catch (err) {
            if (abortController.signal.aborted) return;
            const message = err instanceof Error ? err.message : String(err);
            console.error(`[/api/slop] chunk ${chunk.index} failed:`, err);
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
      if (clientDisconnected) return;

      if (chunkResults.length === 0 && chunkErrors.length > 0) {
        const message = chunkErrors.map((e) => e.message).join(" / ");
        await prisma.slopCheck.update({
          where: { id },
          data: { status: "failed", errorMessage: message, finishedAt: new Date() },
        });
        await settleUsage({
          usages,
          fallbackModels: billableModels,
          metadata: { models: billableModels, completedChunks: 0 },
        });
        send("error", { error: message });
        writer.close();
        return;
      }

      // Aggregate score (weighted by chunk chars) and pick the strongest summary.
      const totalChars = chunkResults.reduce((a, b) => a + b.chars, 0) || 1;
      const finalScore = Math.round(
        chunkResults.reduce((acc, c) => acc + c.score * c.chars, 0) / totalChars,
      );
      const finalSummary =
        chunkResults
          .filter((c) => c.summary.length > 0)
          .sort((a, b) => b.score - a.score)[0]?.summary ?? "";
      const finalLanguage =
        chunkResults.find((c) => c.language)?.language ?? null;

      const completed = await prisma.slopCheck.updateMany({
        where: { id, status: "running" },
        data: {
          status: "complete",
          score: finalScore,
          summary: finalSummary,
          language: finalLanguage,
          findings: JSON.stringify(allFindings),
          finishedAt: new Date(),
        },
      });
      if (completed.count === 0 || clientDisconnected) return;
      await settleUsage({
        usages,
        fallbackModels: billableModels,
        metadata: {
          models: billableModels,
          completedChunks: chunkResults.length,
        },
      });

      send("done", { id, score: finalScore, summary: finalSummary });
      writer.close();
    },
    async cancel() {
      clientDisconnected = true;
      sseWriter?.cancel();
      abortController.abort();
      await prisma.slopCheck
        .updateMany({
          where: { id, status: "running" },
          data: {
            status: "failed",
            errorMessage: ANALYSIS_STREAM_DISCONNECTED_ERROR,
            finishedAt: new Date(),
          },
        })
        .catch((error) => {
          console.error(
            `[/api/slop] could not persist disconnected stream ${id}:`,
            error,
          );
        });
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

function normalizeLang(v: FormDataEntryValue | string | undefined | null): Lang {
  const s = typeof v === "string" ? v.toLowerCase() : undefined;
  if (s === "en" || s === "pt" || s === "es") return s;
  return "en";
}

function cap(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) : s;
}
