import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { ingestUrl } from "@/lib/ingest/url";
import { ingestPdf } from "@/lib/ingest/pdf";
import { ingestText } from "@/lib/ingest/text";
import { splitBlocks } from "@/lib/paragraphs";
import { chunkSentences } from "@/lib/chunker";
import { getProvider, resolveModel } from "@/lib/llm";
import { DEFAULT_MODEL_CHAIN, withModelFallback } from "@/lib/llm/fallback";
import { consume, ipFromRequest, rateLimitResponse } from "@/lib/rate-limit";
import { bucketFromSettings, loadSettings } from "@/lib/settings";
import type { IngestedDocument } from "@/lib/ingest/url";
import { IngestError } from "@/lib/ingest/errors";
import type { ExplainFinding } from "@/lib/explain-schema";
import { normalizeLevel } from "@/lib/explain-schema";
import type { Lang } from "@/lib/fallacies";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_TEXT_CHARS = 200_000;
const CHUNK_CONCURRENCY = 4;
const MAX_TITLE_CHARS = 500;
const MAX_SOURCE_REF_CHARS = 2_000;

export async function POST(req: NextRequest) {
  const settings = await loadSettings();
  // Explanation is cost-equivalent to fallacy detection (one LLM call per
  // chunk, no external search). Same rate-limit bucket as analyze.
  const rl = consume(
    `explain:${ipFromRequest(req)}`,
    bucketFromSettings(settings, "rate.analyze"),
  );
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

  let doc: IngestedDocument;
  let modelId: string | undefined;
  let lang: Lang = "en";
  let level = normalizeLevel(undefined);

  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      modelId = normalizeString(form.get("model"));
      lang = normalizeLang(form.get("lang"));
      level = normalizeLevel(form.get("level"));
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
        | {
            type?: string;
            url?: string;
            text?: string;
            model?: string;
            title?: string;
            lang?: string;
            level?: string;
          }
        | null;
      if (!body) return jsonError("Invalid JSON", 400);
      modelId = body.model ?? undefined;
      lang = normalizeLang(body.lang);
      level = normalizeLevel(body.level);
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

  const blocks = splitBlocks(doc.text);
  if (blocks.length === 0) return jsonError("No paragraphs detected", 422);

  const modelChain: string[] = modelId
    ? Array.from(new Set([resolveModel(modelId).id, ...DEFAULT_MODEL_CHAIN]))
    : [...DEFAULT_MODEL_CHAIN];

  let llm;
  try {
    llm = getProvider(modelChain[0]);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Provider error", 400);
  }

  const id = nanoid(10);
  // Blocks reuse the Sentence shape, so the sentence chunker groups them by
  // accumulated char budget exactly as it does for the other pipelines.
  const chunks = chunkSentences(blocks);

  await prisma.explanation.create({
    data: {
      id,
      status: "running",
      source: doc.source,
      sourceRef: cap(doc.sourceRef, MAX_SOURCE_REF_CHARS),
      title: doc.title ? cap(doc.title, MAX_TITLE_CHARS) : null,
      text: doc.text,
      language: lang,
      provider: llm.id,
      model: llm.defaultModel,
      level,
      blocks: JSON.stringify(blocks),
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
        level,
        blocks,
        provider: llm.id,
        model: llm.defaultModel,
        chunkCount: chunks.length,
      });

      const allFindings: ExplainFinding[] = [];
      // Overview is a whole-document abstract. Each chunk produces its own;
      // we keep the earliest non-empty one (chunk 0 holds the paper's intro/
      // abstract, which yields the most representative overview).
      const overviews = new Map<number, string>();
      const chunkErrors: { index: number; message: string }[] = [];
      let chunkOkCount = 0;

      let cursor = 0;
      const workers: Promise<void>[] = [];
      const launch = async () => {
        while (true) {
          const idx = cursor++;
          if (idx >= chunks.length) return;
          const chunk = chunks[idx];
          let chunkOverview = "";
          send("chunkStart", {
            index: chunk.index,
            blockIds: chunk.sentences.map((s) => s.id),
          });
          try {
            for await (const event of withModelFallback(
              modelChain,
              (model) =>
                llm.explainStream(
                  { sentences: chunk.sentences, lang },
                  { model, signal: abortController.signal, level },
                ),
              abortController.signal,
            )) {
              if (event.type === "finding") {
                allFindings.push(event.finding);
                send("finding", event.finding);
              } else if (event.type === "overview") {
                chunkOverview = event.overview;
              }
            }
            if (chunkOverview) overviews.set(chunk.index, chunkOverview);
            chunkOkCount++;
            send("chunkDone", { index: chunk.index });
          } catch (err) {
            if (abortController.signal.aborted) return;
            const message = err instanceof Error ? err.message : String(err);
            console.error(`[/api/explain] chunk ${chunk.index} failed:`, err);
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

      if (chunkOkCount === 0 && chunkErrors.length > 0) {
        const message = chunkErrors.map((e) => e.message).join(" / ");
        await prisma.explanation.update({
          where: { id },
          data: { status: "failed", errorMessage: message, finishedAt: new Date() },
        });
        send("error", { error: message });
        controller.close();
        return;
      }

      const finalOverview =
        [...overviews.entries()].sort((a, b) => a[0] - b[0])[0]?.[1] ?? "";

      await prisma.explanation.update({
        where: { id },
        data: {
          status: "complete",
          overview: finalOverview,
          findings: JSON.stringify(allFindings),
          finishedAt: new Date(),
        },
      });

      send("done", {
        id,
        overview: finalOverview,
        findingsCount: allFindings.length,
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
