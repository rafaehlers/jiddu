import type { Lang } from "./fallacies";
import { CLINICAL_TRIAL_COPY } from "./clinical-trial-copy";
import { isClinicalTrialConcern, type ClinicalTrialReport } from "./clinical-trial-schema";
import type { QualityAudit, SpecsStageResult } from "./paper-review-audit-schema";
import type { PaperReviewResult } from "./paper-review-schema";

/** Attach the evaluations specialist's structured check, preserving quality dismissals. */
export function withClinicalTrialReport(
  review: PaperReviewResult,
  stages: SpecsStageResult[],
  language: Lang,
  quality?: QualityAudit,
): PaperReviewResult {
  const assessment = stages.find((stage) => stage.criterion === "evaluations")?.clinicalTrialCheck;
  if (!assessment) {
    // Older and non-trial reviews must not acquire a synthetic clinical assessment.
    const rest = { ...review };
    delete rest.clinicalTrial;
    return rest;
  }
  const dismissed = new Set(quality?.findingDecisions
    .filter((decision) => decision.decision === "dismiss")
    .map((decision) => decision.findingId));
  const retained = new Set(review.weaknesses.flatMap((weakness) => weakness.sourceFindingIds));
  return {
    ...review,
    clinicalTrial: {
      language,
      assessment: {
        ...assessment,
        checks: assessment.checks.map((item) => {
          if (!quality || !isClinicalTrialConcern(item.status) ||
            item.findingIds.every((id) => retained.has(id) && !dismissed.has(id))) return item;
          return {
            ...item,
            status: "not_assessable",
            details: CLINICAL_TRIAL_COPY[language].unretained,
            findingIds: [],
          };
        }),
      },
    },
  };
}

export function clinicalTrialToMarkdown(
  report: ClinicalTrialReport,
  weaknesses: PaperReviewResult["weaknesses"],
): string {
  const copy = CLINICAL_TRIAL_COPY[report.language];
  const assessment = report.assessment;
  return `### ${copy.title}

**${copy.designs[assessment.studyDesign]}** — ${assessment.rationale} (${assessment.locations.join("; ")})

${copy.scope}

${assessment.checks.map((item) => {
    const related = weaknesses.filter((weakness) =>
      weakness.sourceFindingIds.some((id) => item.findingIds.includes(id)),
    ).map((weakness) => weakness.id);
    return `- **${copy.checks[item.key]} — ${copy.statuses[item.status]}:** ${item.details} (${item.locations.join("; ")})${related.length ? ` ${copy.relatedWeaknesses}: ${related.join(", ")}.` : ""}`;
  }).join("\n\n")}

`;
}
