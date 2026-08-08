import assert from "node:assert/strict";
import test from "node:test";
import {
  factCheckClaimMatchesStatus,
  factCheckStatusCounts,
} from "@/lib/factcheck-status-filter";
import type { VerdictValue } from "@/lib/verdict-schema";

const verdicts = new Map<string, { verdict: VerdictValue }>([
  ["c1", { verdict: "supported" }],
  ["c2", { verdict: "supported" }],
  ["c3", { verdict: "contradicted" }],
  ["c4", { verdict: "mixed" }],
  ["c5", { verdict: "unverified" }],
]);

test("counts every verdict status and keeps pending claims separate", () => {
  assert.deepEqual(
    factCheckStatusCounts(["c1", "c2", "c3", "c4", "c5", "c6"], verdicts),
    {
      all: 6,
      supported: 2,
      contradicted: 1,
      mixed: 1,
      unverified: 1,
      pending: 1,
    },
  );
});

test("matches a claim against the selected status", () => {
  assert.equal(factCheckClaimMatchesStatus("c1", verdicts, "supported"), true);
  assert.equal(factCheckClaimMatchesStatus("c1", verdicts, "mixed"), false);
  assert.equal(factCheckClaimMatchesStatus("c6", verdicts, "pending"), true);
  assert.equal(factCheckClaimMatchesStatus("c6", verdicts, "all"), true);
});
