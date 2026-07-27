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
import { paperReviewToMarkdown } from "@/lib/paper-review-markdown";
import type { PaperReviewResult } from "@/lib/paper-review-schema";
import type { Lang } from "@/lib/fallacies";
import type { ResolvedVenueProfile } from "@/lib/venues";

export const MAX_PAPER_TEXT_CHARS = 300_000;
export const MAX_PDF_BYTES = 25 * 1024 * 1024;
export const PAPER_REVIEW_STAGE_COUNT = 5;

export const PAPER_REVIEW_STAGES = [
  "ledger",
  "research",
  "synthesis",
  "self_critique",
  "complete",
] as const;

type PreparedScreenshot = {
  pageNumber: number;
  png: Buffer;
};

export type PreparedPaperReview = {
  id: string;
  title: string | null;
  filename: string;
  parser: string | null;
  pageCount: number;
  visualPageCount: number;
  modelId: string;
  lang: Lang;
  venueTarget: string;
  venueProfile: ResolvedVenueProfile;
  reviewDate: string;
  pageTaggedPaper: string;
  screenshots: PreparedScreenshot[];
};

export type PaperReviewJobCallbacks = {
  onStage?: (event: {
    index: number;
    total: number;
    name: string;
  }) => void | Promise<void>;
  onStageDone?: (event: { index: number }) => void | Promise<void>;
};

export class PaperReviewInputError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = "PaperReviewInputError";
  }
}

export async function preparePaperReview(input: {
  buffer: ArrayBuffer;
  filename: string;
  sourceRef?: string;
  lang: Lang;
  modelId?: string;
  venueProfile: ResolvedVenueProfile;
  reviewDate: string;
}): Promise<PreparedPaperReview> {
  const filename = input.filename.trim().slice(0, 2_000) || "paper.pdf";
  if (input.buffer.byteLength === 0) {
    throw new PaperReviewInputError(
      "The uploaded PDF is empty.",
      422,
      "empty_pdf",
    );
  }
  if (input.buffer.byteLength > MAX_PDF_BYTES) {
    throw new PaperReviewInputError(
      `The PDF exceeds the ${MAX_PDF_BYTES / 1024 / 1024} MB upload limit.`,
      413,
      "pdf_too_large",
    );
  }
  if (!looksLikePdf(input.buffer)) {
    throw new PaperReviewInputError(
      "Adversarial review accepts PDF files only.",
      415,
      "not_a_pdf",
    );
  }

  let doc;
  try {
    doc = await ingestPdf(input.buffer, filename, { mode: "academic" });
  } catch (err) {
    throw new PaperReviewInputError(
      err instanceof Error ? err.message : "PDF ingestion failed",
      422,
      "pdf_ingestion_failed",
    );
  }

  if (!doc.pages?.length) {
    throw new PaperReviewInputError(
      "The PDF produced no page-level content.",
      422,
      "no_pages",
    );
  }
  if (doc.text.length > MAX_PAPER_TEXT_CHARS) {
    throw new PaperReviewInputError(
      `The paper is too long for a complete review (${doc.text.length.toLocaleString()} characters; limit ${MAX_PAPER_TEXT_CHARS.toLocaleString()}). It was not truncated.`,
      413,
      "paper_too_long",
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
  const screenshots = await renderPdfPages(input.buffer, visualPageNumbers);
  const modelChoice = resolveModel(input.modelId);
  const id = nanoid(10);

  await prisma.paperReview.create({
    data: {
      id,
      status: "running",
      stage: "ledger",
      source: "pdf",
      sourceRef: (input.sourceRef ?? filename).slice(0, 2_000),
      title: doc.title?.slice(0, 500) ?? null,
      venueTarget: input.venueProfile.targetLabel,
      venueProfile: JSON.stringify(input.venueProfile),
      reviewDate: input.reviewDate,
      language: input.lang,
      provider: modelChoice.family === "anthropic" ? "anthropic" : "openai",
      model: modelChoice.id,
      parser: doc.parser ?? null,
      text: doc.text,
      pages: JSON.stringify(doc.pages),
      complexity: JSON.stringify(doc.complexity ?? []),
    },
  });

  return {
    id,
    title: doc.title,
    filename,
    parser: doc.parser ?? null,
    pageCount: doc.pages.length,
    visualPageCount: screenshots.length,
    modelId: modelChoice.id,
    lang: input.lang,
    venueTarget: input.venueProfile.targetLabel,
    venueProfile: input.venueProfile,
    reviewDate: input.reviewDate,
    pageTaggedPaper,
    screenshots: screenshots.map((page) => ({
      pageNumber: page.pageNumber,
      png: page.png,
    })),
  };
}

export async function runPreparedPaperReview(
  prepared: PreparedPaperReview,
  options?: {
    signal?: AbortSignal;
    callbacks?: PaperReviewJobCallbacks;
  },
): Promise<PaperReviewResult> {
  const { id, pageTaggedPaper, screenshots, venueProfile, reviewDate } =
    prepared;
  const callbacks = options?.callbacks;

  const stage = async (index: number, name: string, dbStage: string) => {
    await prisma.paperReview.update({
      where: { id },
      data: { stage: dbStage },
    });
    await callbacks?.onStage?.({
      index,
      total: PAPER_REVIEW_STAGE_COUNT,
      name,
    });
  };
  const stageDone = async (index: number) => {
    await callbacks?.onStageDone?.({ index });
  };

  try {
    await stage(0, "ledger", "ledger");
    const { ledger, model: ledgerModel } = await buildPaperLedger(
      pageTaggedPaper,
      screenshots,
      {
        modelId: prepared.modelId,
        lang: prepared.lang,
        signal: options?.signal,
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
    await stageDone(0);

    await stage(1, "research", "research");
    const research = await researchPaperNovelty(ledger, venueProfile, {
      modelId: prepared.modelId,
      lang: prepared.lang,
      signal: options?.signal,
    });
    await prisma.paperReview.update({
      where: { id },
      data: { research: JSON.stringify(research) },
    });
    await stageDone(1);

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
          modelId: prepared.modelId,
          lang: prepared.lang,
          signal: options?.signal,
        },
      );
    await prisma.paperReview.update({
      where: { id },
      data: {
        model: synthesisModel,
        initialReview: JSON.stringify(initialReview),
      },
    });
    await stageDone(2);

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
          modelId: prepared.modelId,
          lang: prepared.lang,
          signal: options?.signal,
        },
      );
    const review = normalizeReview(
      critiquedReview,
      ledger.paperTitle,
      ledger.author,
      prepared.venueTarget,
      reviewDate,
    );
    await stageDone(3);

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
    await stageDone(4);
    return review;
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
    throw err;
  }
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
    .slice(0, 6);
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
        (a, b) => severityRank(a.severity) - severityRank(b.severity),
      )
      .map((weakness, index) => ({ ...weakness, id: `W${index + 1}` })),
  };
}

function severityRank(
  severity: PaperReviewResult["weaknesses"][number]["severity"],
) {
  if (severity === "MAJOR") return 0;
  if (severity === "MODERATE") return 1;
  return 2;
}

function looksLikePdf(buffer: ArrayBuffer): boolean {
  const prefix = new TextDecoder("latin1").decode(
    new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 1_024)),
  );
  return prefix.includes("%PDF-");
}
