import assert from "node:assert/strict";
import test from "node:test";
import {
  ALL_FALLACIES_FILTER,
  fallacyCounts,
  fallacyFiltersWithFindings,
  fallacyFindingMatchesFilter,
} from "./fallacy-filter";

const findings = [
  { fallacy: "ad_hominem" },
  { fallacy: "straw_man" },
  { fallacy: "ad_hominem" },
];

test("counts all findings and each detected fallacy", () => {
  const counts = fallacyCounts(findings);

  assert.equal(counts.all, 3);
  assert.equal(counts.ad_hominem, 2);
  assert.equal(counts.straw_man, 1);
  assert.equal(counts.false_dichotomy, undefined);
});

test("offers only fallacy types that occur in the findings", () => {
  assert.deepEqual(fallacyFiltersWithFindings(fallacyCounts(findings)), [
    "ad_hominem",
    "straw_man",
  ]);
});

test("matches a finding against all or one fallacy type", () => {
  assert.equal(
    fallacyFindingMatchesFilter(findings[0], ALL_FALLACIES_FILTER),
    true,
  );
  assert.equal(
    fallacyFindingMatchesFilter(findings[0], "ad_hominem"),
    true,
  );
  assert.equal(
    fallacyFindingMatchesFilter(findings[0], "straw_man"),
    false,
  );
});
