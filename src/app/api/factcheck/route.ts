import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { ingestUrl } from "@/lib/ingest/url";
import { ingestAnalysisFile } from "@/lib/ingest/file";
import { ingestText } from "@/lib/ingest/text";
import { prepareAnalysisDocument } from "@/lib/analysis-document";
import { chunkSentences } from "@/lib/chunker";
import { getProvider, resolveModel } from "@/lib/llm";
import { DEFAULT_MODEL_CHAIN, withModelFallback } from "@/lib/llm/fallback";
import { consume, ipFromRequest, rateLimitResponse } from "@/lib/rate-limit";
import { bucketFromSettings, loadSettings } from "@/lib/settings";
import type { IngestedDocument } from "@/lib/ingest/url";
import { IngestError } from "@/lib/ingest/errors";
import type { Claim } from "@/lib/claims-schema";
import type { Lang } from "@/lib/fallacies";
import { normalizeAppLanguage } from "@/lib/language";
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
  createServerSseWriter,
  type ServerSseWriter,
} from "@/lib/server-sse";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_TEXT_CHARS = 200_000;
const CHUNK_CONCURRENCY = 4;
const MAX_TITLE_CHARS = 500;
const MAX_SOURCE_REF_CHARS = 2_000;
const STREAM_DISCONNECTED_ERROR =
  "The analysis connection ended before claim extraction completed.";

export async function POST(req: NextRequest) {
  const access = await requireWebAnalysisAccess();
  if (isAccessResponse(access)) return access;

  const settings = await loadSettings();
  const rl = consume(
    `factcheck:${ipFromRequest(req)}`,
    bucketFromSettings(settings, "rate.factcheck"),
  );
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

  const maxClaimsPerFactcheck = Math.max(
    1,
    Math.floor(settings["factcheck.maxClaims"]),
  );

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
        feature: "factcheck_extract",
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

  const preparedDocument = prepareAnalysisDocument(doc, MAX_TEXT_CHARS);
  doc = { ...doc, text: preparedDocument.text };
  const { blocks, sentences } = preparedDocument;
  if (sentences.length === 0) return jsonError("No sentences detected", 422);

  // Build the fallback chain. If the caller explicitly picked a model we
  // honour it as the first try and tack the default chain on for resiliency.
  // Otherwise we use the default chain (GPT-5.6 Luna → Gemma 4 31B).
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
    feature: "factcheck_extract",
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
      feature: "factcheck_extract",
      resourceId: id,
      metadata: { modelChain, chunkCount: chunks.length },
    },
  );

  await prisma.factCheck.create({
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
      blocks: JSON.stringify(blocks),
      sentences: JSON.stringify(sentences),
      claims: JSON.stringify([]),
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

      // Persisted state. Each emitted claim gets a stable id so the viewer
      // can address it (and future fact-check phases can persist verdicts
      // against the same key).
      const allClaims: (Claim & { id: string })[] = [];
      let claimCounter = 0;
      const chunkErrors: { index: number; message: string }[] = [];
      let chunkDoneCount = 0;

      let cursor = 0;
      const workers: Promise<void>[] = [];
      const launch = async () => {
        while (true) {
          const idx = cursor++;
          if (idx >= chunks.length) return;
          const chunk = chunks[idx];
          send("chunkStart", {
            index: chunk.index,
            sentenceIds: chunk.sentences.map((s) => s.id),
          });
          try {
            for await (const event of withModelFallback(
              modelChain,
              (model) =>
                llm.extractClaimsStream(
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
              if (event.type === "claim") {
                if (allClaims.length >= maxClaimsPerFactcheck) {
                  // Stop accepting new claims once we hit the cap; abort the
                  // chunk so the LLM doesn't keep generating tokens we'll
                  // throw away.
                  abortController.abort();
                  break;
                }
                const claimId = `c${++claimCounter}`;
                const stored = { id: claimId, ...event.claim };
                allClaims.push(stored);
                send("claim", stored);
              }
            }
            chunkDoneCount++;
            send("chunkDone", { index: chunk.index });
          } catch (err) {
            if (abortController.signal.aborted) return;
            const message = err instanceof Error ? err.message : String(err);
            console.error(`[/api/factcheck] chunk ${chunk.index} failed:`, err);
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

      // A disconnected consumer has already been persisted as failed by
      // cancel(). Do not let the worker's abort path overwrite that row with
      // a misleading complete result containing zero claims.
      if (clientDisconnected) return;

      // If every chunk errored, fail the extraction as a whole.
      if (chunkDoneCount === 0 && chunkErrors.length > 0) {
        const message = chunkErrors.map((e) => e.message).join(" / ");
        await prisma.factCheck.update({
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

      const completed = await prisma.factCheck.updateMany({
        where: { id, status: "running" },
        data: {
          status: "complete",
          // The selected interface language controls generated copy. A model
          // may report the source locale as e.g. `pt-BR`; persisting that value
          // here used to make verification fall back to English.
          language: lang,
          claims: JSON.stringify(allClaims),
          finishedAt: new Date(),
        },
      });
      if (completed.count === 0 || clientDisconnected) return;
      await settleUsage({
        usages,
        fallbackModels: billableModels,
        metadata: {
          models: billableModels,
          completedChunks: chunkDoneCount,
        },
      });

      send("done", {
        id,
        claimCount: allClaims.length,
        truncated: allClaims.length >= maxClaimsPerFactcheck,
      });
      writer.close();
    },
    async cancel() {
      clientDisconnected = true;
      sseWriter?.cancel();
      abortController.abort();
      await prisma.factCheck
        .updateMany({
          where: { id, status: "running" },
          data: {
            status: "failed",
            errorMessage: STREAM_DISCONNECTED_ERROR,
            finishedAt: new Date(),
          },
        })
        .catch((error) => {
          console.error(
            `[/api/factcheck] could not persist disconnected stream ${id}:`,
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

function normalizeString(v: FormDataEntryValue | string | undefined | null): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s.length > 0 ? s : undefined;
}

function normalizeLang(v: FormDataEntryValue | string | undefined | null): Lang {
  return normalizeAppLanguage(v);
}

function cap(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) : s;
}
