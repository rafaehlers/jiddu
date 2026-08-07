import assert from "node:assert/strict";
import test from "node:test";
import {
  correctedProfileNeedsRefresh,
  hasFreshKnowledgeSource,
  hasKnowledgeSource,
  knowledgeCanonicalKey,
  normalizeKnowledgeName,
} from "./context-knowledge-cache";

test("normalizes names and stable canonical keys across accents and punctuation", () => {
  assert.equal(
    normalizeKnowledgeName("  Luís Inácio — Lula!  "),
    "luis inacio lula",
  );
  assert.equal(
    knowledgeCanonicalKey("person", "Luís Inácio — Lula!"),
    "person:luis inacio lula",
  );
});

test("cache freshness is scoped by source type and TTL", () => {
  const now = Date.parse("2026-08-06T12:00:00.000Z");
  const sources = [
    {
      sourceType: "wikipedia",
      retrievedAt: "2026-08-06T11:59:00.000Z",
    },
    {
      sourceType: "news",
      retrievedAt: "2026-08-06T03:00:00.000Z",
    },
  ];

  assert.equal(
    hasFreshKnowledgeSource(sources, "news", 8 * 60 * 60 * 1_000, now),
    false,
  );
  assert.equal(
    hasFreshKnowledgeSource(sources, "wikipedia", 8 * 60 * 60 * 1_000, now),
    true,
  );
  assert.equal(hasKnowledgeSource(sources, "news"), true);
  assert.equal(hasKnowledgeSource(sources, "official"), false);
});

test("refreshes a corrected profile only until the new lookup completes", () => {
  const correctedAt = "2026-08-07T12:00:00.000Z";

  assert.equal(correctedProfileNeedsRefresh(correctedAt, null), true);
  assert.equal(
    correctedProfileNeedsRefresh(
      correctedAt,
      new Date("2026-08-07T11:59:59.000Z"),
    ),
    true,
  );
  assert.equal(
    correctedProfileNeedsRefresh(
      correctedAt,
      new Date("2026-08-07T12:00:01.000Z"),
    ),
    false,
  );
});
