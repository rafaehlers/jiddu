import type { PaperReview } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { PaperReviewResultSchema } from "@/lib/paper-review-schema";
import { PAPER_REVIEW_STAGES } from "@/lib/paper-review-job";
import { parseStoredVenueProfile } from "@/lib/venues";

export function mapPaperReviewJob(row: PaperReview, origin: string) {
  const stageIndex = Math.max(
    0,
    PAPER_REVIEW_STAGES.indexOf(
      row.stage as (typeof PAPER_REVIEW_STAGES)[number],
    ),
  );
  const parsedReview = parseReview(row.review);

  return {
    id: row.id,
    status: row.status,
    stage: row.stage,
    progress: {
      completed_stages:
        row.status === "complete"
          ? PAPER_REVIEW_STAGES.length
          : row.status === "failed"
            ? stageIndex
            : stageIndex,
      total_stages: PAPER_REVIEW_STAGES.length,
    },
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
): Promise<PaperReview | null> {
  const row = await prisma.paperReview.findUnique({ where: { id } });
  if (
    !row ||
    row.status !== "running" ||
    Date.now() - row.createdAt.getTime() < 30 * 60 * 1_000
  ) {
    return row;
  }

  return prisma.paperReview.update({
    where: { id },
    data: {
      status: "failed",
      errorMessage:
        "The review worker was interrupted before the job completed. Start a new review.",
      finishedAt: new Date(),
    },
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
