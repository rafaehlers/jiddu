import { FALLACY_IDS } from "@/lib/fallacies";

export const ALL_FALLACIES_FILTER = "all";

type FindingWithFallacy = { fallacy: string };

export function fallacyCounts(
  findings: readonly FindingWithFallacy[],
): Record<string, number> {
  const counts: Record<string, number> = {
    [ALL_FALLACIES_FILTER]: findings.length,
  };

  for (const finding of findings) {
    counts[finding.fallacy] = (counts[finding.fallacy] ?? 0) + 1;
  }
  return counts;
}

export function fallacyFiltersWithFindings(
  counts: Readonly<Record<string, number>>,
): string[] {
  return FALLACY_IDS.filter((fallacy) => (counts[fallacy] ?? 0) > 0);
}

export function fallacyFindingMatchesFilter(
  finding: FindingWithFallacy,
  filter: string,
): boolean {
  return filter === ALL_FALLACIES_FILTER || finding.fallacy === filter;
}
