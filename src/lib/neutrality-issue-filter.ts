import {
  NEUTRALITY_ISSUES,
  type NeutralityIssue,
} from "@/lib/neutrality-schema";

export const NEUTRALITY_ISSUE_FILTERS = [
  "all",
  ...NEUTRALITY_ISSUES,
] as const;

export type NeutralityIssueFilter =
  (typeof NEUTRALITY_ISSUE_FILTERS)[number];

type FindingWithIssue = { issue: NeutralityIssue };

export function neutralityIssueCounts(
  findings: readonly FindingWithIssue[],
): Record<NeutralityIssueFilter, number> {
  const counts: Record<NeutralityIssueFilter, number> = {
    all: findings.length,
    loaded_language: 0,
    asymmetric_attribution: 0,
    false_equivalence: 0,
    selective_omission: 0,
    source_asymmetry: 0,
    both_sidesing: 0,
    steering: 0,
    genetic_framing: 0,
  };

  for (const finding of findings) counts[finding.issue] += 1;
  return counts;
}

export function neutralityFindingMatchesIssue(
  finding: FindingWithIssue,
  filter: NeutralityIssueFilter,
): boolean {
  return filter === "all" || finding.issue === filter;
}
