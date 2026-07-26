import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { ingestPdf, renderPdfPages } from "@/lib/ingest/pdf";
import {
  buildInitialPaperReview,
  buildPaperLedger,
  researchPaperNovelty,
  selfCritiquePaperReview,
} from "@/lib/llm/paper-review";
import { resolveModel } from "@/lib/llm";
import {
  paperReviewToMarkdown,
} from "@/lib/paper-review-markdown";
import type { PaperReviewResult } from "@/lib/paper-review-schema";
import { consume, ipFromRequest, rateLimitResponse } from "@/lib/rate-limit";
import { bucketFromSettings, loadSettings } from "@/lib/settings";
import type { Lang } from "@/lib/fallacies";
import { resolveVenueProfile } from "@/lib/venues";

export const runtime = "nodejs";
export const maxDuration = 900;

const MAX_TEXT_CHARS = 300_000;
const MAX_VISUAL_PAGES = 6;
const STAGE_COUNT = 5;

export async function POST(req: NextRequest) {
  const settings = await loadSettings();
  const rl = consume(
    `review:${ipFromRequest(req)}`,
    bucketFromSettings(settings, "rate.review"),
  );
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return jsonError("A single PDF upload is required.", 415);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError("Invalid multipart form.", 400);
  }

  const files = form.getAll("file");
  if (files.length !== 1 || !(files[0] instanceof File)) {
    return jsonError("Upload exactly one PDF.", 400);
  }
  const file = files[0];
  const filename = file.name || "paper.pdf";
  if (
    !filename.toLowerCase().endsWith(".pdf") &&
    file.type !== "application/pdf"
  ) {
    return jsonError("Adversarial review accepts PDF files only.", 415);
  }

  const lang = normalizeLang(form.get("lang"));
  const modelChoice = resolveModel(normalizeString(form.get("model")));
  const venueProfile = resolveVenueProfile({
    profileId: normalizeString(form.get("venueProfileId"))?.slice(0, 100),
    venueName: normalizeString(form.get("venue"))?.slice(0, 300),
    year: normalizeString(form.get("venueYear")),
    track: normalizeString(form.get("venueTrack"))?.slice(0, 200),
    paperType: normalizeString(form.get("paperType")),
  });
  const venueTarget = venueProfile.targetLabel;
  const reviewDate =
    normalizeDate(normalizeString(form.get("reviewDate"))) ??
    new Date().toISOString().slice(0, 10);

  let buffer: ArrayBuffer;
  let doc;
  try {
    buffer = await file.arrayBuffer();
    doc = await ingestPdf(buffer, filename, { mode: "academic" });
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "PDF ingestion failed",
      422,
    );
  }

  if (!doc.pages?.length) {
    return jsonError("The PDF produced no page-level content.", 422);
  }
  if (doc.text.length > MAX_TEXT_CHARS) {
    return jsonError(
      `The paper is too long for a complete review (${doc.text.length.toLocaleString()} characters; limit ${MAX_TEXT_CHARS.toLocaleString()}). It was not truncated.`,
      413,
    );
  }

  const pageTaggedPaper = doc.pages
    .map(
      (page) =>
        `\n\n<<< MANUSCRIPT PAGE ${page.pageNumber} >>>\n\n${
          page.markdown || page.text
        }`,
    )
    .join("")
    .trim();
  const visualPageNumbers = selectVisualPages(doc.pages, doc.complexity);
  const screenshots = await renderPdfPages(buffer, visualPageNumbers);

  const id = nanoid(10);
  await prisma.paperReview.create({
    data: {
      id,
      status: "running",
      stage: "ledger",
      source: "pdf",
      sourceRef: filename.slice(0, 2_000),
      title: doc.title?.slice(0, 500) ?? null,
      venueTarget,
      venueProfile: JSON.stringify(venueProfile),
      reviewDate,
      language: lang,
      provider: modelChoice.family === "anthropic" ? "anthropic" : "openai",
      model: modelChoice.id,
      parser: doc.parser ?? null,
      text: doc.text,
      pages: JSON.stringify(doc.pages),
      complexity: JSON.stringify(doc.complexity ?? []),
    },
  });

  const encoder = new TextEncoder();
  const abortController = new AbortController();
  let streamOpen = true;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (!streamOpen) return;
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };
      const stage = async (
        index: number,
        name: string,
        dbStage: string,
      ) => {
        await prisma.paperReview.update({
          where: { id },
          data: { stage: dbStage },
        });
        send("stage", { index, total: STAGE_COUNT, name });
      };
      const stageDone = (index: number) => {
        send("chunkDone", { index });
      };

      send("meta", {
        id,
        title: doc.title,
        source: "pdf",
        sourceRef: filename,
        parser: doc.parser,
        pageCount: doc.pages?.length ?? 0,
        visualPageCount: screenshots.length,
        model: modelChoice.id,
        venueTarget,
        venueProfileVerified: venueProfile.profileVerified,
        chunkCount: STAGE_COUNT,
      });

      try {
        await stage(0, "ledger", "ledger");
        const { ledger, model: ledgerModel } = await buildPaperLedger(
          pageTaggedPaper,
          screenshots.map((page) => ({
            pageNumber: page.pageNumber,
            png: page.png,
          })),
          {
            modelId: modelChoice.id,
            lang,
            signal: abortController.signal,
          },
        );
        await prisma.paperReview.update({
          where: { id },
          data: {
            title: ledger.paperTitle.slice(0, 500),
            author: ledger.author.slice(0, 500),
            model: ledgerModel,
            ledger: JSON.stringify(ledger),
          },
        });
        stageDone(0);

        await stage(1, "research", "research");
        const research = await researchPaperNovelty(ledger, venueProfile, {
          modelId: modelChoice.id,
          lang,
          signal: abortController.signal,
        });
        await prisma.paperReview.update({
          where: { id },
          data: { research: JSON.stringify(research) },
        });
        stageDone(1);

        await stage(2, "synthesis", "synthesis");
        const { review: initialReview, model: synthesisModel } =
          await buildInitialPaperReview(
            {
              paper: pageTaggedPaper,
              ledger,
              research,
              venueProfile,
              reviewDate,
            },
            {
              modelId: modelChoice.id,
              lang,
              signal: abortController.signal,
            },
          );
        await prisma.paperReview.update({
          where: { id },
          data: {
            model: synthesisModel,
            initialReview: JSON.stringify(initialReview),
          },
        });
        stageDone(2);

        await stage(3, "self_critique", "self_critique");
        const { review: critiquedReview, model: finalModel } =
          await selfCritiquePaperReview(
            {
              paper: pageTaggedPaper,
              ledger,
              research,
              initialReview,
              venueProfile,
              reviewDate,
            },
            {
              modelId: modelChoice.id,
              lang,
              signal: abortController.signal,
            },
          );
        const review = normalizeReview(
          critiquedReview,
          ledger.paperTitle,
          ledger.author,
          venueTarget,
          reviewDate,
        );
        stageDone(3);

        await stage(4, "finalize", "complete");
        const markdown = paperReviewToMarkdown(review, venueProfile);
        await prisma.paperReview.update({
          where: { id },
          data: {
            status: "complete",
            stage: "complete",
            title: review.paper.slice(0, 500),
            author: review.author.slice(0, 500),
            model: finalModel,
            review: JSON.stringify(review),
            markdown,
            finishedAt: new Date(),
          },
        });
        stageDone(4);
        send("done", {
          id,
          recommendation: review.recommendation,
          weaknessCount: review.weaknesses.length,
        });
        if (streamOpen) controller.close();
        streamOpen = false;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await prisma.paperReview
          .update({
            where: { id },
            data: {
              status: "failed",
              errorMessage: message,
              finishedAt: new Date(),
            },
          })
          .catch(() => null);
        send("error", { error: message });
        if (streamOpen) controller.close();
        streamOpen = false;
      }
    },
    cancel() {
      streamOpen = false;
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

function selectVisualPages(
  pages: NonNullable<Awaited<ReturnType<typeof ingestPdf>>["pages"]>,
  complexity: Awaited<ReturnType<typeof ingestPdf>>["complexity"],
): number[] {
  const selected = new Set<number>();
  for (const page of complexity ?? []) {
    if (
      page.hasSubstantialImages ||
      page.isGarbled ||
      page.reasons.some((reason) =>
        ["scanned", "embedded-images", "vector-text"].includes(reason),
      )
    ) {
      selected.add(page.pageNumber);
    }
  }
  for (const page of pages) {
    if (
      /(?:^|\n)\s*(?:figure|fig\.|table|algorithm|architecture)\s+\d+/im.test(
        page.text,
      )
    ) {
      selected.add(page.pageNumber);
    }
  }
  return Array.from(selected)
    .sort((a, b) => a - b)
    .slice(0, MAX_VISUAL_PAGES);
}

function normalizeReview(
  review: PaperReviewResult,
  paper: string,
  author: string,
  venueTarget: string,
  reviewDate: string,
): PaperReviewResult {
  return {
    ...review,
    paper,
    author,
    venueTarget,
    reviewDate,
    weaknesses: [...review.weaknesses]
      .sort(
        (a, b) =>
          severityRank(a.severity) - severityRank(b.severity),
      )
      .map((weakness, index) => ({ ...weakness, id: `W${index + 1}` })),
  };
}

function severityRank(severity: PaperReviewResult["weaknesses"][number]["severity"]) {
  if (severity === "MAJOR") return 0;
  if (severity === "MODERATE") return 1;
  return 2;
}

function normalizeString(
  value: FormDataEntryValue | string | undefined | null,
): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function normalizeLang(value: FormDataEntryValue | null): Lang {
  return value === "pt" || value === "es" || value === "en" ? value : "en";
}

function normalizeDate(value?: string): string | undefined {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}
