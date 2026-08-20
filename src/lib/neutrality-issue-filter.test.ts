import assert from "node:assert/strict";
import test from "node:test";
import {
  neutralityFindingMatchesIssue,
  neutralityIssueCounts,
} from "@/lib/neutrality-issue-filter";
import type { NeutralityIssue } from "@/lib/neutrality-schema";

const findings: Array<{ issue: NeutralityIssue }> = [
  { issue: "loaded_language" },
  { issue: "loaded_language" },
  { issue: "steering" },
  { issue: "genetic_framing" },
];

test("counts every neutrality issue and the complete set", () => {
  assert.deepEqual(neutralityIssueCounts(findings), {
    all: 4,
    loaded_language: 2,
    asymmetric_attribution: 0,
    false_equivalence: 0,
    selective_omission: 0,
    source_asymmetry: 0,
    both_sidesing: 0,
    steering: 1,
    genetic_framing: 1,
  });
});

test("matches a neutrality finding against the selected issue", () => {
  assert.equal(
    neutralityFindingMatchesIssue(findings[0], "loaded_language"),
    true,
  );
  assert.equal(neutralityFindingMatchesIssue(findings[0], "steering"), false);
  assert.equal(neutralityFindingMatchesIssue(findings[0], "all"), true);
});
