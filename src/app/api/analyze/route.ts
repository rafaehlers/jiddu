import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { ingestUrl } from "@/lib/ingest/url";
import { ingestPdf } from "@/lib/ingest/pdf";
import { ingestText } from "@/lib/ingest/text";
import { splitSentences } from "@/lib/sentences";
import { chunkSentences } from "@/lib/chunker";
import { getProvider } from "@/lib/llm";
import type { IngestedDocument } from "@/lib/ingest/url";
import { IngestError } from "@/lib/ingest/errors";
import type { Finding } from "@/lib/schema";
import { resolveModel } from "@/lib/llm";
import type { Lang } from "@/lib/fallacies";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_TEXT_CHARS = 200_000;
const CHUNK_CONCURRENCY = 4;
const MAX_TITLE_CHARS = 500;
const MAX_SOURCE_REF_CHARS = 2_000;

export async function POST(req: NextRequest) {
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

  const chosenModel = resolveModel(modelId);
  let llm;
  try {
    llm = getProvider(chosenModel.id);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Provider error", 400);
  }

  const id = nanoid(10);
  const chunks = chunkSentences(sentences);

  // Create the row up-front so the id is meaningful.
  await prisma.analysis.create({
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
      score: 0,
      summary: null,
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

      // Initial meta.
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

      const allFindings: Finding[] = [];
      const chunkResults: { score: number; summary: string; chars: number; language: string | null }[] = [];
      const chunkErrors: { index: number; message: string }[] = [];

      // Bounded concurrency for chunks. Failures on one chunk are reported via
      // the `chunkError` SSE event and do not abort the others.
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
            for await (const event of llm.analyzeStream(
              { sentences: chunk.sentences, lang },
              { signal: abortController.signal },
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
            console.error(`[/api/analyze] chunk ${chunk.index} failed:`, err);
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

      // If every chunk errored, fail the analysis as a whole.
      if (chunkResults.length === 0 && chunkErrors.length > 0) {
        const message = chunkErrors.map((e) => e.message).join(" / ");
        await prisma.analysis.update({
          where: { id },
          data: { status: "failed", errorMessage: message, finishedAt: new Date() },
        });
        send("error", { error: message });
        controller.close();
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

      await prisma.analysis.update({
        where: { id },
        data: {
          status: "complete",
          score: finalScore,
          summary: finalSummary,
          language: finalLanguage,
          findings: JSON.stringify(allFindings),
          finishedAt: new Date(),
        },
      });

      send("done", { id, score: finalScore, summary: finalSummary });
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
