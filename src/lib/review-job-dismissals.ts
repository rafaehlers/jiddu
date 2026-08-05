export const REVIEW_JOB_DISMISSALS_STORAGE_KEY =
  "jiddu.dismissed-review-jobs.v1";

const MAX_DISMISSED_REVIEW_JOBS = 100;

export function parseDismissedReviewJobIds(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return Array.from(
      new Set(parsed.filter((id): id is string => typeof id === "string" && id.length > 0)),
    ).slice(-MAX_DISMISSED_REVIEW_JOBS);
  } catch {
    return [];
  }
}

export function addDismissedReviewJobId(
  dismissedIds: string[],
  jobId: string,
): string[] {
  return [...dismissedIds.filter((id) => id !== jobId), jobId].slice(
    -MAX_DISMISSED_REVIEW_JOBS,
  );
}
