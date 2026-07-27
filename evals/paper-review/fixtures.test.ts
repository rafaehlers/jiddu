import assert from "node:assert/strict";
import test from "node:test";
import { SPECS_CRITERIA } from "../../src/lib/paper-review-audit-schema";
import { PAPER_REVIEW_EVAL_CASES } from "./fixtures";

test("paper-review benchmark contains six cases for every SPECS criterion", () => {
  assert.equal(PAPER_REVIEW_EVAL_CASES.length, 30);
  assert.equal(new Set(PAPER_REVIEW_EVAL_CASES.map((item) => item.id)).size, 30);
  for (const criterion of SPECS_CRITERIA) {
    assert.equal(
      PAPER_REVIEW_EVAL_CASES.filter((item) => item.criterion === criterion)
        .length,
      6,
    );
  }
});
