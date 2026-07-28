import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { ingestUrl } from "@/lib/ingest/url";
import { ingestPdf } from "@/lib/ingest/pdf";
import { ingestText } from "@/lib/ingest/text";
import { splitSentences } from "@/lib/sentences";
import { chunkSentences } from "@/lib/chunker";
import { getProvider, resolveModel } from "@/lib/llm";
import { DEFAULT_MODEL_CHAIN, withModelFallback } from "@/lib/llm/fallback";
import { consume, ipFromRequest, rateLimitResponse } from "@/lib/rate-limit";
import { bucketFromSettings, loadSettings } from "@/lib/settings";
import type { IngestedDocument } from "@/lib/ingest/url";
import { IngestError } from "@/lib/ingest/errors";
import type { Claim } from "@/lib/claims-schema";
import type { Lang } from "@/lib/fallacies";
import {
  isAccessResponse,
  requireWebAnalysisAccess,
} from "@/lib/web-analysis-access";
import {
  isCreditResponse,
  reserveWebAnalysisCredits,
} from "@/lib/web-credit-billing";
import {
  maxCreditsForCalls,
} from "@/lib/jiddu-credit-rates";
import { settleJidduCreditReservationFromUsage } from "@/lib/jiddu-credits";
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

  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      modelId = normalizeString(form.get("model"));
      lang = normalizeLang(form.get("lang"));
      const file = form.get("file");
      if (!(file instanceof File)) return jsonError("Missing 'file' field", 400);
      const buf = await file.arrayBuffer();
      const name = file.name || "upload";
      const lower = name.toLowerCase();
      if (lower.endsWith(".pdf") || file.type === "application/pdf") {
        doc = await ingestPdf(buf, name);
      } else if (lower.endsWith(".txt") || file.type.startsWith("text/")) {
        doc = ingestText(new TextDecoder().decode(buf), {
          title: name,
          sourceRef: name,
        });
      } else {
        return jsonError("Unsupported file type. Use PDF or TXT.", 415);
      }
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

  // Build the fallback chain. If the caller explicitly picked a model we
  // honour it as the first try and tack the default chain on for resiliency.
  // Otherwise we use the default chain (gpt-5.4-mini → minimax-m3).
  const modelChain: string[] = modelId
    ? Array.from(new Set([resolveModel(modelId).id, ...DEFAULT_MODEL_CHAIN]))
    : [...DEFAULT_MODEL_CHAIN];

  let llm;
  try {
    llm = getProvider(modelChain[0], access.apiKey);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Provider error", 400);
  }

  const id = nanoid(10);
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
      sentences: JSON.stringify(sentences),
      claims: JSON.stringify([]),
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

      // Persisted state. Each emitted claim gets a stable id so the viewer
      // can address it (and future fact-check phases can persist verdicts
      // against the same key).
      const allClaims: (Claim & { id: string })[] = [];
      let claimCounter = 0;
      let detectedLanguage: string | null = null;
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
              } else if (event.type === "language") {
                if (!detectedLanguage && event.language) {
                  detectedLanguage = event.language;
                }
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

      // If every chunk errored, fail the extraction as a whole.
      if (chunkDoneCount === 0 && chunkErrors.length > 0) {
        const message = chunkErrors.map((e) => e.message).join(" / ");
        await prisma.factCheck.update({
          where: { id },
          data: { status: "failed", errorMessage: message, finishedAt: new Date() },
        });
        await settleJidduCreditReservationFromUsage(
          creditReservation,
          {
            usages,
            fallbackModels: billableModels,
            resourceId: id,
            metadata: { models: billableModels, completedChunks: 0 },
          },
        );
        send("error", { error: message });
        controller.close();
        return;
      }

      await prisma.factCheck.update({
        where: { id },
        data: {
          status: "complete",
          language: detectedLanguage,
          claims: JSON.stringify(allClaims),
          finishedAt: new Date(),
        },
      });
      await settleJidduCreditReservationFromUsage(
        creditReservation,
        {
          usages,
          fallbackModels: billableModels,
          resourceId: id,
          metadata: {
            models: billableModels,
            completedChunks: chunkDoneCount,
          },
        },
      );

      send("done", {
        id,
        claimCount: allClaims.length,
        truncated: allClaims.length >= maxClaimsPerFactcheck,
      });
      controller.close();
    },
    async cancel() {
      abortController.abort();
      await settleJidduCreditReservationFromUsage(
        creditReservation,
        {
          usages,
          fallbackModels: billableModels,
          resourceId: id,
          note: "Client disconnected before completion.",
          metadata: { models: billableModels },
        },
      );
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
