export const REPORT_TITLE_MAX_LENGTH = 160;

export const REPORT_TITLE_KINDS = [
  "a",
  "f",
  "n",
  "e",
  "s",
  "r",
  "live",
] as const;

export type ReportTitleKind = (typeof REPORT_TITLE_KINDS)[number];

export function canManageReportTitle(
  userId: string | null | undefined,
  ownerUserId: string | null | undefined,
) {
  return Boolean(userId && ownerUserId && userId === ownerUserId);
}
