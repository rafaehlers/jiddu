import assert from "node:assert/strict";
import test from "node:test";
import {
  addDismissedReviewJobId,
  parseDismissedReviewJobIds,
} from "./review-job-dismissals";

test("parses persisted review-job dismissals", () => {
  assert.deepEqual(parseDismissedReviewJobIds('["review-1","review-2"]'), [
    "review-1",
    "review-2",
  ]);
});

test("ignores malformed or invalid persisted values", () => {
  assert.deepEqual(parseDismissedReviewJobIds("not-json"), []);
  assert.deepEqual(parseDismissedReviewJobIds('{"id":"review-1"}'), []);
  assert.deepEqual(
    parseDismissedReviewJobIds('["review-1",null,3,"", "review-1"]'),
    ["review-1"],
  );
});

test("moves an existing dismissal to the newest position", () => {
  assert.deepEqual(
    addDismissedReviewJobId(["review-1", "review-2"], "review-1"),
    ["review-2", "review-1"],
  );
});

test("keeps only the 100 most recent dismissals", () => {
  const existing = Array.from({ length: 100 }, (_, index) => `review-${index}`);
  const result = addDismissedReviewJobId(existing, "review-new");

  assert.equal(result.length, 100);
  assert.equal(result[0], "review-1");
  assert.equal(result.at(-1), "review-new");
});
