import assert from "node:assert/strict";
import test from "node:test";
import { QualityAuditSchema } from "./paper-review-audit-schema";

test("normalizes model-generated text wrappers in a quality audit", () => {
  const result = QualityAuditSchema.parse({
    summary: { text: "The review needs one correction." },
    flags: [
      {
        category: "unsupported_claim",
        severity: "warning",
        description: {
          issue: "The rejection rationale is too strong.",
          evidence: "The cited experiment is only preliminary.",
        },
        relatedFindingIds: ["E1"],
      },
    ],
    findingDecisions: [
      {
        findingId: "E1",
        decision: "retain",
        reason: { message: "The specialist finding is supported." },
      },
    ],
  });

  assert.equal(result.summary, "The review needs one correction.");
  assert.equal(
    result.flags[0].description,
    "Issue: The rejection rationale is too strong. Evidence: The cited experiment is only preliminary.",
  );
  assert.equal(
    result.findingDecisions[0].reason,
    "The specialist finding is supported.",
  );
});

test("still rejects arbitrary nested objects in quality-audit text", () => {
  const result = QualityAuditSchema.safeParse({
    summary: "Audit summary",
    flags: [
      {
        category: "structural",
        severity: "warning",
        description: { nested: { text: "Do not silently stringify this." } },
        relatedFindingIds: [],
      },
    ],
    findingDecisions: [],
  });

  assert.equal(result.success, false);
});
