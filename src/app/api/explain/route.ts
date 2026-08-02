import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { ingestUrl } from "@/lib/ingest/url";
import { ingestAnalysisFile } from "@/lib/ingest/file";
import { ingestPdf, renderPdfPages } from "@/lib/ingest/pdf";
import { ingestText } from "@/lib/ingest/text";
import { splitExplainDocument } from "@/lib/paper-structure";
import { getExplainableBlocks } from "@/lib/explain-sections";
import {
  buildExplainInputSections,
  capExplainBlocks,
  chunkExplainSections,
  normalizeFindingForSections,
  normalizeFindingsForSections,
} from "@/lib/explain-units";
import { getProvider, resolveModel } from "@/lib/llm";
import { DEFAULT_MODEL_CHAIN, withModelFallback } from "@/lib/llm/fallback";
import { consume, ipFromRequest, rateLimitResponse } from "@/lib/rate-limit";
import { bucketFromSettings, loadSettings } from "@/lib/settings";
import type { IngestedDocument } from "@/lib/ingest/url";
import { IngestError } from "@/lib/ingest/errors";
import type { ExplainFinding } from "@/lib/explain-schema";
import {
  normalizeLevel,
  sanitizePaperEvidenceFirstResult,
  sanitizePaperSynthesis,
  type PaperEvidenceFirstResult,
  type PaperMap,
} from "@/lib/explain-schema";
import { selectPaperEvidenceBlocks } from "@/lib/paper-evidence-prompt";
import { selectVisualPages } from "@/lib/paper-visual-pages";
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
import { withModelFallbackPromise } from "@/lib/llm/fallback";

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
  let pdfBuffer: ArrayBuffer | null = null;
  const id = nanoid(10);

  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      modelId = normalizeString(form.get("model"));
      lang = normalizeLang(form.get("lang"));
      level = normalizeLevel(form.get("level"));
      const file = form.get("file");
      if (!(file instanceof File)) return jsonError("Missing 'file' field", 400);
      const isPdf =
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (isPdf) {
        pdfBuffer = await file.arrayBuffer();
        doc = await ingestPdf(pdfBuffer, file.name || "paper.pdf", {
          mode: "academic",
        });
      } else {
        const ingested = await ingestAnalysisFile(file, {
          access,
          feature: "explain",
          resourceId: id,
          modelId,
          lang,
          signal: req.signal,
        });
        if (ingested instanceof Response) return ingested;
        doc = ingested;
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

  const blocks = capExplainBlocks(splitExplainDocument(doc), MAX_TEXT_CHARS);
  if (blocks.some((block) => block.analysisUnit === "section")) {
    // Keep persisted/printed source text aligned with the same normalized,
    // size-bounded structure rendered and sent to the model.
    doc = { ...doc, text: blocks.map((block) => block.text).join("\n\n") };
  }
  const explainableBlocks = getExplainableBlocks(blocks);
  if (explainableBlocks.length === 0) {
    return jsonError("No substantive paper sections detected", 422);
  }
  const explainSections = buildExplainInputSections(explainableBlocks);

  const modelChain: string[] = modelId
    ? Array.from(new Set([resolveModel(modelId).id, ...DEFAULT_MODEL_CHAIN]))
    : [...DEFAULT_MODEL_CHAIN];

  let llm;
  try {
    llm = getProvider(modelChain[0], access.apiKey);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Provider error", 400);
  }

  // Technical batches may contain several complete sections, but never split
  // a section or become visible navigation units.
  const chunks = chunkExplainSections(explainSections);
  const creditReservation = await reserveWebAnalysisCredits(access, {
    // One call per section batch, one evidence-first methods/results reading,
    // and one bounded whole-document synthesis. The evidence-first call is
    // skipped for documents with no recognizable method or result sections;
    // settlement always follows actual completed usage.
    amount: maxCreditsForCalls(modelChain, chunks.length + 2),
    feature: "explain",
    resourceId: id,
    metadata: {
      modelChain,
      chunkCount: chunks.length,
      evidenceFirstCalls: 1,
      synthesisCalls: 1,
    },
  });
  if (isCreditResponse(creditReservation)) return creditReservation;
  const billableModels: string[] = [];
  const usages: OpenRouterUsage[] = [];

  await prisma.explanation.create({
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
          const emittedSectionIds = new Set<string>();
          send("chunkStart", {
            index: chunk.index,
            blockIds: chunk.sections.flatMap((section) =>
              section.blocks.map((block) => block.id),
            ),
          });
          try {
            for await (const event of withModelFallback(
              modelChain,
              (model) =>
                llm.explainStream(
                  { sections: chunk.sections, lang },
                  {
                    model,
                    signal: abortController.signal,
                    level,
                    onUsage: (usage) => usages.push(usage),
                  },
                ),
              abortController.signal,
              (model) => billableModels.push(model),
            )) {
              if (event.type === "finding") {
                const finding = normalizeFindingForSections(
                  event.finding,
                  chunk.sections,
                  emittedSectionIds,
                );
                if (finding) {
                  allFindings.push(finding);
                  send("finding", finding);
                }
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

      const explainableIds = new Set(explainableBlocks.map((block) => block.id));
      const blockPos = new Map(blocks.map((block, index) => [block.id, index]));
      const orderedFindings = normalizeFindingsForSections(
        allFindings,
        explainSections,
      )
        .map((finding) => ({
          ...finding,
          blockIds: finding.blockIds.filter((id) => explainableIds.has(id)),
        }))
        .filter((finding) => finding.blockIds.length > 0)
        .sort((a, b) => {
        const aPos = blockPos.get(a.blockIds[0]) ?? Number.POSITIVE_INFINITY;
        const bPos = blockPos.get(b.blockIds[0]) ?? Number.POSITIVE_INFINITY;
        return aPos - bPos;
      });
      let finalOverview =
        [...overviews.entries()].sort((a, b) => a[0] - b[0])[0]?.[1] ?? "";
      let paperMap: PaperMap | null = null;
      let evidenceFirst: PaperEvidenceFirstResult | null = null;
      let visualPageCount = 0;

      const rolesByBlock = new Map<string, string>();
      for (const finding of orderedFindings) {
        for (const blockId of finding.blockIds) {
          rolesByBlock.set(blockId, finding.role);
        }
      }
      const evidenceBlocks = selectPaperEvidenceBlocks(
        explainableBlocks,
        rolesByBlock,
      );
      if (evidenceBlocks.length > 0) {
        send("evidenceStart", {});
        try {
          const visualPageNumbers =
            pdfBuffer && doc.pages
              ? selectVisualPages(doc.pages, doc.complexity)
              : [];
          const screenshots = pdfBuffer
            ? await renderPdfPages(pdfBuffer, visualPageNumbers)
            : [];
          visualPageCount = screenshots.length;
          const evidenceOutput = await withModelFallbackPromise(
            modelChain,
            (model) =>
              llm.analyzePaperEvidence(
                {
                  title: doc.title,
                  blocks: evidenceBlocks,
                  visualPages: screenshots.map((page) => ({
                    pageNumber: page.pageNumber,
                    base64: page.png.toString("base64"),
                  })),
                  lang,
                  level,
                },
                {
                  model,
                  signal: abortController.signal,
                  onUsage: (usage) => usages.push(usage),
                },
              ),
            abortController.signal,
            (model) => billableModels.push(model),
          );
          evidenceFirst = sanitizePaperEvidenceFirstResult(
            evidenceOutput.result,
            explainableIds,
          );
        } catch (err) {
          if (!abortController.signal.aborted) {
            console.error("[/api/explain] evidence-first reading failed:", err);
          }
        }
        send("evidenceDone", { complete: evidenceFirst !== null });
      }

      // The per-chunk overview is useful while streaming, but only a final
      // synthesis has seen evidence from the methods, results, conclusion and
      // limitations together. Failure here does not discard the completed
      // paragraph explanations; legacy overview behaviour remains a fallback.
      send("synthesisStart", {});
      try {
        const synthesisOutput = await withModelFallbackPromise(
          modelChain,
          (model) =>
            llm.synthesizePaperMap(
              {
                title: doc.title,
                blocks: explainableBlocks,
                findings: orderedFindings,
                chunkOverviews: [...overviews.entries()]
                  .sort((a, b) => a[0] - b[0])
                  .map(([, value]) => value),
                lang,
                level,
                evidenceFirst,
              },
              {
                model,
                signal: abortController.signal,
                onUsage: (usage) => usages.push(usage),
              },
            ),
          abortController.signal,
          (model) => billableModels.push(model),
        );
        const synthesis = sanitizePaperSynthesis(
          synthesisOutput.result,
          explainableIds,
        );
        if (synthesis.overview) finalOverview = synthesis.overview;
        paperMap = synthesis.paperMap;
      } catch (err) {
        if (!abortController.signal.aborted) {
          console.error("[/api/explain] paper-map synthesis failed:", err);
        }
      }

      await prisma.explanation.update({
        where: { id },
        data: {
          status: "complete",
          overview: finalOverview,
          paperMap: paperMap ? JSON.stringify(paperMap) : null,
          findings: JSON.stringify(orderedFindings),
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
            completedChunks: chunkOkCount,
            evidenceFirstCompleted: evidenceFirst !== null,
            visualPageCount,
            paperMapCompleted: paperMap !== null,
          },
        },
      );

      send("done", {
        id,
        overview: finalOverview,
        paperMap,
        findingsCount: orderedFindings.length,
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
