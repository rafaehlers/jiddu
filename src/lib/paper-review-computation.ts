import type {
  ComputationAuditItem,
  ComputationProposal,
  QualityAudit,
  RetentionAudit,
  SpecsStageResult,
} from "./paper-review-audit-schema";
import type { PaperReviewResult } from "./paper-review-schema";

export function auditComputations(
  stages: SpecsStageResult[],
): ComputationAuditItem[] {
  return stages.flatMap((stage) =>
    stage.computationChecks.map((proposal) => auditComputation(proposal)),
  );
}

export function auditComputation(
  proposal: ComputationProposal,
): ComputationAuditItem {
  const computedValue = calculate(proposal);
  if (computedValue === null || !Number.isFinite(computedValue)) {
    return {
      ...proposal,
      status: "invalid",
      computedValue: null,
      absoluteError: null,
      note: "The proposed check could not be evaluated with the supplied values.",
    };
  }

  const absoluteError = Math.abs(computedValue - proposal.reportedValue);
  const passed = absoluteError <= proposal.tolerance;
  return {
    ...proposal,
    status: passed ? "passed" : "failed",
    computedValue,
    absoluteError,
    note: passed
      ? "The reported value matches the deterministic recalculation within tolerance."
      : `The deterministic recalculation differs by ${formatNumber(absoluteError)}.`,
  };
}

export function buildRetentionAudit(
  stages: SpecsStageResult[],
  review: PaperReviewResult,
  quality: QualityAudit,
): RetentionAudit {
  const decisions = new Map(
    quality.findingDecisions.map((decision) => [
      decision.findingId,
      decision.decision,
    ]),
  );
  const requiredFindingIds = stages
    .flatMap((stage) => stage.findings)
    .filter(
      (finding) =>
        finding.retainInFinal &&
        finding.severity !== "MINOR" &&
        decisions.get(finding.id) !== "dismiss",
    )
    .map((finding) => finding.id);
  const retained = new Set(
    review.weaknesses.flatMap((weakness) => weakness.sourceFindingIds),
  );
  const dismissedFindingIds = Array.from(decisions)
    .filter(([, decision]) => decision === "dismiss")
    .map(([findingId]) => findingId);
  const retainedFindingIds = requiredFindingIds.filter((id) => retained.has(id));

  return {
    requiredFindingIds,
    retainedFindingIds,
    dismissedFindingIds,
    missingFindingIds: requiredFindingIds.filter((id) => !retained.has(id)),
  };
}

function calculate(proposal: ComputationProposal): number | null {
  const values = proposal.values;
  const [a, b, c] = values;
  switch (proposal.operation) {
    case "sum":
      return values.reduce((total, value) => total + value, 0);
    case "difference":
      return values.length === 2 ? a - b : null;
    case "product":
      return values.reduce((total, value) => total * value, 1);
    case "quotient":
      return values.length === 2 && b !== 0 ? a / b : null;
    case "mean":
      return values.reduce((total, value) => total + value, 0) / values.length;
    case "weighted_mean": {
      if (
        proposal.weights.length !== values.length ||
        proposal.weights.length === 0
      ) {
        return null;
      }
      const weightTotal = proposal.weights.reduce(
        (total, weight) => total + weight,
        0,
      );
      if (weightTotal === 0) return null;
      return (
        values.reduce(
          (total, value, index) =>
            total + value * (proposal.weights[index] ?? 0),
          0,
        ) / weightTotal
      );
    }
    case "percentage":
      return values.length === 2 && b !== 0 ? (a / b) * 100 : null;
    case "percentage_change":
      return values.length === 2 && a !== 0 ? ((b - a) / Math.abs(a)) * 100 : null;
    case "precision":
      return values.length === 2 && a + b !== 0 ? a / (a + b) : null;
    case "recall":
      return values.length === 2 && a + b !== 0 ? a / (a + b) : null;
    case "f1": {
      if (values.length === 2 && a + b !== 0) return (2 * a * b) / (a + b);
      if (
        values.length === 3 &&
        a + b !== 0 &&
        a + c !== 0
      ) {
        const precision = a / (a + b);
        const recall = a / (a + c);
        return precision + recall === 0
          ? 0
          : (2 * precision * recall) / (precision + recall);
      }
      return null;
    }
  }
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toPrecision(6);
}
