import type { VerdictValue } from "@/lib/verdict-schema";

export const FACTCHECK_STATUS_FILTERS = [
  "all",
  "supported",
  "contradicted",
  "mixed",
  "unverified",
  "pending",
] as const;

export type FactCheckStatusFilter =
  (typeof FACTCHECK_STATUS_FILTERS)[number];

type VerdictStatus = { verdict: VerdictValue };

export function factCheckStatusCounts(
  claimIds: readonly string[],
  verdicts: ReadonlyMap<string, VerdictStatus>,
): Record<FactCheckStatusFilter, number> {
  const counts: Record<FactCheckStatusFilter, number> = {
    all: claimIds.length,
    supported: 0,
    contradicted: 0,
    mixed: 0,
    unverified: 0,
    pending: 0,
  };

  for (const claimId of claimIds) {
    const status = verdicts.get(claimId)?.verdict ?? "pending";
    counts[status] += 1;
  }

  return counts;
}

export function factCheckClaimMatchesStatus(
  claimId: string,
  verdicts: ReadonlyMap<string, VerdictStatus>,
  filter: FactCheckStatusFilter,
): boolean {
  if (filter === "all") return true;
  return (verdicts.get(claimId)?.verdict ?? "pending") === filter;
}
