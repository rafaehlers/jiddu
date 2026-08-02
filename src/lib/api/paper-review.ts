import type { PaperReview } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { PaperReviewResultSchema } from "@/lib/paper-review-schema";
import { PAPER_REVIEW_STAGES } from "@/lib/paper-review-job";
import { parseStoredVenueProfile } from "@/lib/venues";
import {
  appendPaperReviewTelemetry,
  summarizePaperReviewTelemetry,
} from "@/lib/paper-review-telemetry";

const INTERRUPTED_REVIEW_ERROR =
  "The review worker was interrupted before the job completed. Start a new review.";

type PaperReviewJobRow = Pick<
  PaperReview,
  | "id"
  | "status"
  | "stage"
  | "title"
  | "sourceRef"
  | "reviewDepth"
  | "telemetry"
  | "errorMessage"
  | "createdAt"
  | "finishedAt"
>;

export type PaperReviewJobStatus = ReturnType<typeof mapPaperReviewJobStatus>;

export function mapPaperReviewJobStatus(row: PaperReviewJobRow) {
  const totalStages = PAPER_REVIEW_STAGES.length;
  const stageIndex = Math.max(
    0,
    PAPER_REVIEW_STAGES.indexOf(
      row.stage as (typeof PAPER_REVIEW_STAGES)[number],
    ),
  );

  return {
    id: row.id,
    status: row.status,
    stage: row.stage,
    title: row.title,
    sourceRef: row.sourceRef,
    reviewDepth: row.reviewDepth,
    progress: {
      completedStages: row.status === "complete" ? totalStages : stageIndex,
      totalStages,
    },
    timeline: summarizePaperReviewTelemetry(row.telemetry),
    error: row.status === "failed" ? row.errorMessage : null,
    viewerUrl: `/r/${row.id}`,
    observedAt: new Date().toISOString(),
    createdAt: row.createdAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
  };
}

export function mapPaperReviewJob(row: PaperReview, origin: string) {
  const status = mapPaperReviewJobStatus(row);
  const parsedReview = parseReview(row.review);

  return {
    id: row.id,
    status: row.status,
    stage: row.stage,
    progress: {
      completed_stages:
        row.status === "complete"
          ? PAPER_REVIEW_STAGES.length
          : status.progress.completedStages,
      total_stages: PAPER_REVIEW_STAGES.length,
    },
    timeline: status.timeline,
    paper: {
      title: row.title,
      author: row.author,
      venue_target: row.venueTarget,
      venue_profile: parseStoredVenueProfile(row.venueProfile),
      review_date: row.reviewDate,
      language: row.language,
      parser: row.parser,
      model: row.model,
      depth: row.reviewDepth,
    },
    result:
      parsedReview?.success && row.status === "complete"
        ? parsedReview.data
        : null,
    error: row.status === "failed" ? row.errorMessage : null,
    urls: {
      status: `${origin}/api/v1/adversarial-reviews/${row.id}`,
      viewer: `${origin}/r/${row.id}`,
      markdown: `${origin}/api/review/${row.id}/markdown`,
      print: `${origin}/r/${row.id}/print`,
    },
    created_at: row.createdAt.toISOString(),
    finished_at: row.finishedAt?.toISOString() ?? null,
  };
}

export async function findPaperReviewJob(
  id: string,
  ownerWorkosUserId: string,
): Promise<PaperReview | null> {
  const row = await prisma.paperReview.findFirst({
    where: { id, ownerWorkosUserId },
  });
  if (
    !row ||
    row.status !== "running" ||
    Date.now() - row.createdAt.getTime() < 30 * 60 * 1_000
  ) {
    return row;
  }

  const finishedAt = new Date();
  await prisma.paperReview.update({
    where: { id },
    data: {
      status: "failed",
      errorMessage: INTERRUPTED_REVIEW_ERROR,
      finishedAt,
    },
  });
  await appendInterruptionTelemetry(row, finishedAt);
  return prisma.paperReview.findUnique({ where: { id } });
}

export async function listPaperReviewJobs(
  ownerWorkosUserId: string,
  take = 10,
): Promise<PaperReviewJobRow[]> {
  const staleRows = await prisma.paperReview.findMany({
    where: {
      ownerWorkosUserId,
      status: "running",
      createdAt: { lt: new Date(Date.now() - 30 * 60 * 1_000) },
    },
    select: { id: true, telemetry: true },
  });
  const finishedAt = new Date();
  await prisma.paperReview.updateMany({
    where: { id: { in: staleRows.map((row) => row.id) } },
    data: {
      status: "failed",
      errorMessage: INTERRUPTED_REVIEW_ERROR,
      finishedAt,
    },
  });
  await Promise.all(
    staleRows.map((row) => appendInterruptionTelemetry(row, finishedAt)),
  );

  return prisma.paperReview.findMany({
    where: { ownerWorkosUserId },
    orderBy: { createdAt: "desc" },
    take: Math.max(1, Math.min(25, take)),
    select: {
      id: true,
      status: true,
      stage: true,
      title: true,
      sourceRef: true,
      reviewDepth: true,
      telemetry: true,
      errorMessage: true,
      createdAt: true,
      finishedAt: true,
    },
  });
}

async function appendInterruptionTelemetry(
  row: { id: string; telemetry: string },
  finishedAt: Date,
) {
  const timeline = summarizePaperReviewTelemetry(row.telemetry);
  const stage = timeline.find((timing) => timing.status === "running");
  if (!stage) return;
  const finishedAtIso = finishedAt.toISOString();
  for (const call of stage.calls.filter((timing) => timing.status === "running")) {
    await appendPaperReviewTelemetry(row.id, {
      kind: "call_failed",
      callId: call.id,
      stageIndex: stage.index,
      stage: stage.name,
      operation: call.operation,
      model: call.model,
      startedAt: call.startedAt,
      finishedAt: finishedAtIso,
      durationMs: Math.max(
        0,
        finishedAt.getTime() - new Date(call.startedAt).getTime(),
      ),
      error: INTERRUPTED_REVIEW_ERROR,
    });
  }
  await appendPaperReviewTelemetry(row.id, {
    kind: "stage_failed",
    stageIndex: stage.index,
    stage: stage.name,
    startedAt: stage.startedAt,
    finishedAt: finishedAtIso,
    durationMs: Math.max(
      0,
      finishedAt.getTime() - new Date(stage.startedAt).getTime(),
    ),
    error: INTERRUPTED_REVIEW_ERROR,
  });
}

function parseReview(value: string | null) {
  if (!value) return null;
  try {
    return PaperReviewResultSchema.safeParse(JSON.parse(value));
  } catch {
    return null;
  }
}
