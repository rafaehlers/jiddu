import assert from "node:assert/strict";
import test from "node:test";
import { auditComputation, buildRetentionAudit } from "./paper-review-computation";
import type {
  QualityAudit,
  SpecsStageResult,
} from "./paper-review-audit-schema";
import type { PaperReviewResult } from "./paper-review-schema";

test("recalculates percentages without executing arbitrary code", () => {
  const result = auditComputation({
    id: "E-calc-1",
    description: "Reported success rate",
    location: "p. 4, Table 2",
    operation: "percentage",
    values: [8, 10],
    weights: [],
    reportedValue: 75,
    tolerance: 0.001,
    unit: "%",
  });
  assert.equal(result.status, "failed");
  assert.equal(result.computedValue, 80);
  assert.equal(result.absoluteError, 5);
});

test("retention audit requires major specialist findings unless dismissed", () => {
  const stages: SpecsStageResult[] = [
    {
      criterion: "evaluations",
      summary: "Evaluation audit",
      computationChecks: [],
      findings: [
        {
          id: "E1",
          criterion: "evaluations",
          title: "Missing baseline",
          body: "The central comparison omits the strongest baseline.",
          locations: ["p. 4"],
          severity: "MAJOR",
          confidence: 0.9,
          retainInFinal: true,
          claimIds: [],
        },
      ],
    },
  ];
  const review = {
    weaknesses: [{ sourceFindingIds: [] }],
  } as unknown as PaperReviewResult;
  const quality: QualityAudit = {
    summary: "No dismissal",
    flags: [],
    findingDecisions: [
      { findingId: "E1", decision: "retain", reason: "Supported" },
    ],
  };
  assert.deepEqual(buildRetentionAudit(stages, review, quality).missingFindingIds, [
    "E1",
  ]);
});
