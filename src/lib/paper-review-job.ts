import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { ingestPdf, renderPdfPages } from "@/lib/ingest/pdf";
import {
  auditPaperReviewQuality,
  buildInitialPaperReview,
  buildPaperLedger,
  repairPaperReview,
  researchPaperNovelty,
  runSpecsStage,
  selfCritiquePaperReview,
  type PaperReviewModelCallEvent,
} from "@/lib/llm/paper-review";
import { resolveModel } from "@/lib/llm";
import { paperReviewToMarkdown } from "@/lib/paper-review-markdown";
import type { PaperReviewResult } from "@/lib/paper-review-schema";
import {
  REVIEW_DEPTHS,
  SPECS_CRITERIA,
  type QualityAudit,
  type ReviewDepth,
  type SpecsCriterion,
  type SpecsStageResult,
} from "@/lib/paper-review-audit-schema";
import {
  auditComputations,
  buildRetentionAudit,
} from "@/lib/paper-review-computation";
import { validateReviewSources } from "@/lib/paper-review-source-validation";
import type { Lang } from "@/lib/fallacies";
import type { ResolvedVenueProfile } from "@/lib/venues";
import type { OpenRouterUsage } from "@/lib/openrouter-usage";
import { loadStringSettings } from "@/lib/settings";
import { analysisRoutingFromSettings } from "@/lib/analysis-routing";
import { selectVisualPages } from "@/lib/paper-visual-pages";
import { appendPaperReviewTelemetry } from "@/lib/paper-review-telemetry";

export const MAX_PAPER_TEXT_CHARS = 300_000;
export const MAX_PDF_BYTES = 25 * 1024 * 1024;
export const PAPER_REVIEW_STAGE_COUNT = 9;

export const PAPER_REVIEW_STAGES = [
  "ledger",
  "research",
  "specs",
  "verification",
  "synthesis",
  "self_critique",
  "source_validation",
  "quality_audit",
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
  reviewDepth: ReviewDepth;
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
  onBillableCall?: (event: {
    operation: string;
    model: string;
  }) => void | Promise<void>;
  onUsage?: (usage: OpenRouterUsage) => void | Promise<void>;
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
  ownerWorkosUserId?: string;
  lang: Lang;
  modelId?: string;
  reviewDepth?: ReviewDepth;
  venueProfile: ResolvedVenueProfile;
  reviewDate: string;
}): Promise<PreparedPaperReview> {
  const ingestStarted = Date.now();
  const ingestStartedAt = new Date(ingestStarted).toISOString();
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
  const reviewDepth = REVIEW_DEPTHS.includes(
    input.reviewDepth ?? "standard",
  )
    ? (input.reviewDepth ?? "standard")
    : "standard";
  const id = nanoid(10);
  const ingestFinished = Date.now();
  const ingestFinishedAt = new Date(ingestFinished).toISOString();

  await prisma.paperReview.create({
    data: {
      id,
      ownerWorkosUserId: input.ownerWorkosUserId ?? null,
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
      reviewDepth,
      parser: doc.parser ?? null,
      text: doc.text,
      pages: JSON.stringify(doc.pages),
      complexity: JSON.stringify(doc.complexity ?? []),
      telemetry: JSON.stringify([
        {
          kind: "stage_started",
          stageIndex: -1,
          stage: "ingest",
          at: ingestStartedAt,
        },
        {
          kind: "stage_completed",
          stageIndex: -1,
          stage: "ingest",
          startedAt: ingestStartedAt,
          finishedAt: ingestFinishedAt,
          durationMs: Math.max(0, ingestFinished - ingestStarted),
        },
      ]),
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
    reviewDepth,
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
    apiKey?: string;
    callbacks?: PaperReviewJobCallbacks;
  },
): Promise<PaperReviewResult> {
  const { id, pageTaggedPaper, screenshots, venueProfile, reviewDate } =
    prepared;
  const callbacks = options?.callbacks;
  let activeStage:
    | {
        index: number;
        name: string;
        started: number;
        startedAt: string;
      }
    | undefined;

  const stage = async (index: number, name: string, dbStage: string) => {
    const started = Date.now();
    const startedAt = new Date(started).toISOString();
    activeStage = { index, name, started, startedAt };
    await prisma.paperReview.update({
      where: { id },
      data: { stage: dbStage },
    });
    await appendPaperReviewTelemetry(id, {
      kind: "stage_started",
      stageIndex: index,
      stage: name,
      at: startedAt,
    });
    await callbacks?.onStage?.({
      index,
      total: PAPER_REVIEW_STAGE_COUNT,
      name,
    });
  };
  const stageDone = async (index: number) => {
    if (activeStage?.index === index) {
      const finished = Date.now();
      await appendPaperReviewTelemetry(id, {
        kind: "stage_completed",
        stageIndex: index,
        stage: activeStage.name,
        startedAt: activeStage.startedAt,
        finishedAt: new Date(finished).toISOString(),
        durationMs: Math.max(0, finished - activeStage.started),
      });
      activeStage = undefined;
    }
    await callbacks?.onStageDone?.({ index });
  };
  const recordModelCall = async (event: PaperReviewModelCallEvent) => {
    const current = activeStage;
    if (!current) return;
    if (event.kind === "started") {
      await appendPaperReviewTelemetry(id, {
        kind: "call_started",
        callId: event.callId,
        stageIndex: current.index,
        stage: current.name,
        operation: event.operation,
        model: event.model,
        startedAt: event.startedAt,
      });
      return;
    }
    await appendPaperReviewTelemetry(id, {
      kind: event.kind === "completed" ? "call_completed" : "call_failed",
      callId: event.callId,
      stageIndex: current.index,
      stage: current.name,
      operation: event.operation,
      model: event.model,
      startedAt: event.startedAt,
      finishedAt: event.finishedAt,
      durationMs: event.durationMs,
      error: event.error,
    });
  };
  const callTelemetry = (operation: string) => ({
    operation,
    onCallEvent: recordModelCall,
  });
  const routing = await loadStringSettings();
  const analysisRouting = analysisRoutingFromSettings(routing);
  const analysisFallback = {
    fallbackModels: analysisRouting.modelChain,
    providerRoutingByModel: analysisRouting.providerRoutingByModel,
  };
  const deepModel =
    prepared.reviewDepth === "deep"
      ? routing["paperReview.deepModel"]
      : prepared.modelId;
  const criticModel =
    prepared.reviewDepth === "deep"
      ? routing["paperReview.criticModel"]
      : prepared.modelId === "gemma-4-31b-it"
        ? "gpt-5.6-luna"
        : "gemma-4-31b-it";
  const stageModels: Record<string, string> = {};

  try {
    await stage(0, "ledger", "ledger");
    const { ledger, model: ledgerModel } = await buildPaperLedger(
      pageTaggedPaper,
      screenshots,
      {
        modelId: prepared.modelId,
        ...analysisFallback,
        lang: prepared.lang,
        ...callTelemetry("ledger"),
        signal: options?.signal,
        apiKey: options?.apiKey,
        onUsage: callbacks?.onUsage,
      },
    );
    stageModels.ledger = ledgerModel;
    await callbacks?.onBillableCall?.({
      operation: "ledger",
      model: ledgerModel,
    });
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
      modelId: deepModel,
      ...analysisFallback,
      lang: prepared.lang,
      ...callTelemetry("research"),
      signal: options?.signal,
      apiKey: options?.apiKey,
      onUsage: callbacks?.onUsage,
    });
    stageModels.research = research.model ?? deepModel;
    await callbacks?.onBillableCall?.({
      operation: "research",
      model: research.model ?? deepModel,
    });
    await prisma.paperReview.update({
      where: { id },
      data: { research: JSON.stringify(research) },
    });
    await stageDone(1);

    await stage(2, "specs", "specs");
    const specialistResults = await Promise.all(
      SPECS_CRITERIA.map(async (criterion) => {
        const specialistModel = modelForCriterion(
          criterion,
          prepared.reviewDepth,
          prepared.modelId,
          deepModel,
        );
        const result = await runSpecsStage(
          {
            criterion,
            paper: pageTaggedPaper,
            ledger,
            research: criterion === "significance" ? research : undefined,
            venueProfile,
            visualPages: visualPagesForCriterion(criterion, screenshots),
          },
          {
            modelId: specialistModel,
            ...analysisFallback,
            lang: prepared.lang,
            ...callTelemetry(`specs_${criterion}`),
            signal: options?.signal,
            apiKey: options?.apiKey,
            onUsage: callbacks?.onUsage,
          },
        );
        stageModels[`specs_${criterion}`] = result.model;
        await callbacks?.onBillableCall?.({
          operation: `specs_${criterion}`,
          model: result.model,
        });
        return result.stage;
      }),
    );
    await prisma.paperReview.update({
      where: { id },
      data: { specsReviews: JSON.stringify(specialistResults) },
    });
    await stageDone(2);

    await stage(3, "verification", "verification");
    const computations = auditComputations(specialistResults);
    await prisma.paperReview.update({
      where: { id },
      data: { computationAudit: JSON.stringify(computations) },
    });
    await stageDone(3);

    await stage(4, "synthesis", "synthesis");
    const { review: initialReview, model: synthesisModel } =
      await buildInitialPaperReview(
        {
          paper: pageTaggedPaper,
          ledger,
          research,
          specs: specialistResults,
          computations,
          venueProfile,
          reviewDate,
        },
        {
          modelId: deepModel,
          ...analysisFallback,
          lang: prepared.lang,
          ...callTelemetry("synthesis"),
          signal: options?.signal,
          apiKey: options?.apiKey,
          onUsage: callbacks?.onUsage,
        },
      );
    stageModels.synthesis = synthesisModel;
    await callbacks?.onBillableCall?.({
      operation: "synthesis",
      model: synthesisModel,
    });
    await prisma.paperReview.update({
      where: { id },
      data: {
        model: synthesisModel,
        initialReview: JSON.stringify(initialReview),
      },
    });
    await stageDone(4);

    await stage(5, "self_critique", "self_critique");
    const { review: critiquedReview, model: critiqueModel } =
      await selfCritiquePaperReview(
        {
          paper: pageTaggedPaper,
          ledger,
          research,
          specs: specialistResults,
          computations,
          initialReview,
          venueProfile,
          reviewDate,
        },
        {
          modelId: deepModel,
          ...analysisFallback,
          lang: prepared.lang,
          ...callTelemetry("self_critique"),
          signal: options?.signal,
          apiKey: options?.apiKey,
          onUsage: callbacks?.onUsage,
        },
      );
    stageModels.self_critique = critiqueModel;
    await callbacks?.onBillableCall?.({
      operation: "self_critique",
      model: critiqueModel,
    });
    let review = normalizeReview(
      critiquedReview,
      ledger.paperTitle,
      ledger.author,
      prepared.venueTarget,
      reviewDate,
    );
    await stageDone(5);

    await stage(6, "source_validation", "source_validation");
    review = {
      ...review,
      sources: await validateReviewSources(review.sources),
    };
    await prisma.paperReview.update({
      where: { id },
      data: { sourceAudit: JSON.stringify(review.sources) },
    });
    await stageDone(6);

    await stage(7, "quality_audit", "quality_audit");
    const { quality: rawQuality, model: qualityModel } =
      await auditPaperReviewQuality(
        {
          review,
          specs: specialistResults,
          computations,
          sources: review.sources,
        },
        {
          modelId: criticModel,
          ...analysisFallback,
          lang: prepared.lang,
          ...callTelemetry("quality_audit"),
          signal: options?.signal,
          apiKey: options?.apiKey,
          onUsage: callbacks?.onUsage,
        },
      );
    const quality = completeQualityDecisions(rawQuality, specialistResults);
    stageModels.quality_audit = qualityModel;
    await callbacks?.onBillableCall?.({
      operation: "quality_audit",
      model: qualityModel,
    });
    let retention = buildRetentionAudit(specialistResults, review, quality);
    const requiresRepair =
      retention.missingFindingIds.length > 0 ||
      quality.flags.some((flag) => flag.severity === "blocking");
    let finalModel = critiqueModel;

    if (requiresRepair) {
      const repaired = await repairPaperReview(
        {
          paper: pageTaggedPaper,
          ledger,
          research,
          specs: specialistResults,
          computations,
          review,
          quality,
          missingFindingIds: retention.missingFindingIds,
          venueProfile,
          reviewDate,
        },
        {
          modelId: deepModel,
          ...analysisFallback,
          lang: prepared.lang,
          ...callTelemetry("final_repair"),
          signal: options?.signal,
          apiKey: options?.apiKey,
          onUsage: callbacks?.onUsage,
        },
      );
      finalModel = repaired.model;
      stageModels.final_repair = repaired.model;
      await callbacks?.onBillableCall?.({
        operation: "final_repair",
        model: repaired.model,
      });
      review = normalizeReview(
        repaired.review,
        ledger.paperTitle,
        ledger.author,
        prepared.venueTarget,
        reviewDate,
      );
      review = { ...review, sources: await validateReviewSources(review.sources) };
      retention = buildRetentionAudit(specialistResults, review, quality);
    }

    review = enforceRetention(review, specialistResults, retention.missingFindingIds);
    retention = buildRetentionAudit(specialistResults, review, quality);
    review = {
      ...review,
      audit: buildPublicAuditSummary({
        depth: prepared.reviewDepth,
        specs: specialistResults,
        computations,
        quality,
        retention,
        sources: review.sources,
        criticModel: qualityModel,
      }),
    };
    await prisma.paperReview.update({
      where: { id },
      data: {
        qualityAudit: JSON.stringify({
          ...quality,
          model: qualityModel,
          stageModels,
        }),
        retentionAudit: JSON.stringify(retention),
        sourceAudit: JSON.stringify(review.sources),
      },
    });
    await stageDone(7);

    await stage(8, "finalize", "complete");
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
    await stageDone(8);
    return review;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (activeStage) {
      const finished = Date.now();
      await appendPaperReviewTelemetry(id, {
        kind: "stage_failed",
        stageIndex: activeStage.index,
        stage: activeStage.name,
        startedAt: activeStage.startedAt,
        finishedAt: new Date(finished).toISOString(),
        durationMs: Math.max(0, finished - activeStage.started),
        error: message.slice(0, 1_000),
      });
      activeStage = undefined;
    }
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

function modelForCriterion(
  criterion: SpecsCriterion,
  depth: ReviewDepth,
  selectedModel: string,
  deepModel: string,
): string {
  if (depth === "standard") return selectedModel;
  return criterion === "story" || criterion === "presentation"
    ? selectedModel
    : deepModel;
}

function visualPagesForCriterion(
  criterion: SpecsCriterion,
  screenshots: PreparedScreenshot[],
): PreparedScreenshot[] {
  return criterion === "presentation" ||
    criterion === "evaluations" ||
    criterion === "correctness"
    ? screenshots
    : [];
}

function completeQualityDecisions(
  quality: QualityAudit,
  stages: SpecsStageResult[],
): QualityAudit {
  const validIds = new Set(
    stages.flatMap((stage) => stage.findings.map((finding) => finding.id)),
  );
  const decisions = new Map(
    quality.findingDecisions
      .filter((decision) => validIds.has(decision.findingId))
      .map((decision) => [decision.findingId, decision]),
  );
  for (const finding of stages.flatMap((stage) => stage.findings)) {
    if (!decisions.has(finding.id)) {
      decisions.set(finding.id, {
        findingId: finding.id,
        decision: "retain",
        reason:
          "The critic omitted this finding, so the conservative retention policy applies.",
      });
    }
  }
  return { ...quality, findingDecisions: Array.from(decisions.values()) };
}

function enforceRetention(
  review: PaperReviewResult,
  stages: SpecsStageResult[],
  missingFindingIds: string[],
): PaperReviewResult {
  if (missingFindingIds.length === 0) return review;
  const findings = new Map(
    stages
      .flatMap((stage) => stage.findings)
      .map((finding) => [finding.id, finding]),
  );
  const weaknesses = [...review.weaknesses];
  for (const findingId of missingFindingIds) {
    const finding = findings.get(findingId);
    if (!finding) continue;
    weaknesses.push({
      id: `W${weaknesses.length + 1}`,
      severity: finding.severity,
      title: finding.title,
      body: finding.body,
      locations: finding.locations,
      sourceFindingIds: [finding.id],
    });
  }
  return normalizeReview(
    { ...review, weaknesses },
    review.paper,
    review.author,
    review.venueTarget,
    review.reviewDate,
  );
}

function buildPublicAuditSummary(args: {
  depth: ReviewDepth;
  specs: SpecsStageResult[];
  computations: ReturnType<typeof auditComputations>;
  quality: QualityAudit;
  retention: ReturnType<typeof buildRetentionAudit>;
  sources: PaperReviewResult["sources"];
  criticModel: string;
}): NonNullable<PaperReviewResult["audit"]> {
  const findings = args.specs.flatMap((stage) => stage.findings);
  const verified = args.sources.filter(
    (source) => source.verificationStatus === "verified",
  ).length;
  return {
    methodology:
      "Independent SPECS specialists, deterministic computation checks, source metadata validation, adversarial self-critique, independent quality audit, and a finding-retention gate.",
    depth: args.depth,
    specialistFindings: findings.length,
    retainedFindings: args.retention.retainedFindingIds.length,
    dismissedFindings: args.retention.dismissedFindingIds.length,
    computationChecks: args.computations.length,
    computationFailures: args.computations.filter(
      (check) => check.status !== "passed",
    ).length,
    sourcesVerified: verified,
    sourcesUnverified: args.sources.length - verified,
    criticModel: args.criticModel,
    criticFlags: args.quality.flags.length,
  };
}

function looksLikePdf(buffer: ArrayBuffer): boolean {
  const prefix = new TextDecoder("latin1").decode(
    new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 1_024)),
  );
  return prefix.includes("%PDF-");
}
