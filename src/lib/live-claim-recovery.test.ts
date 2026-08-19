import assert from "node:assert/strict";
import test from "node:test";
import type { Claim } from "./claims-schema";
import {
  claimsAreDuplicates,
  filterNewRecoveredClaims,
  planLiveClaimRecovery,
} from "./live-claim-recovery";
import type { Sentence } from "./schema";

const sentences: Sentence[] = Array.from({ length: 8 }, (_value, index) => ({
  id: `s${index + 1}`,
  start: index * 10,
  end: index * 10 + 9,
  text: `Frase factual número ${index + 1}.`,
}));

const claim = (sentenceId: string, statement: string): Claim => ({
  sentenceIds: [sentenceId],
  statement,
  type: "categorical",
  rationale: "Pode ser verificada.",
});

test("recovery resumes with a small overlap after the last captured claim", () => {
  const plan = planLiveClaimRecovery({
    sentences,
    existingClaims: [claim("s5", "A quinta frase contém um fato.")],
  });

  assert.equal(plan.chunks[0][0].id, "s3");
  assert.equal(plan.scannedThroughSentenceId, "s8");
  assert.equal(plan.hasMore, false);
});

test("a persisted cursor advances recovery even when a chunk found no claims", () => {
  const plan = planLiveClaimRecovery({
    sentences,
    existingClaims: [],
    lastScannedSentenceId: "s4",
  });

  assert.equal(plan.chunks[0][0].id, "s5");
});

test("recovery exposes when more transcript remains for another pass", () => {
  const plan = planLiveClaimRecovery({
    sentences,
    existingClaims: [],
    maxChunkSentences: 2,
    maxChunks: 2,
  });

  assert.deepEqual(
    plan.chunks.map((chunk) => chunk.map((sentence) => sentence.id)),
    [
      ["s1", "s2"],
      ["s3", "s4"],
    ],
  );
  assert.equal(plan.scannedThroughSentenceId, "s4");
  assert.equal(plan.hasMore, true);
});

test("deduplication uses exact text globally and similarity within one sentence", () => {
  const existing = [
    claim("s2", "João afirmou que a inflação caiu para cinco por cento."),
  ];
  const candidates = [
    claim("s7", "João afirmou que a inflação caiu para cinco por cento."),
    claim("s2", "João afirmou que a inflação caiu para 5 por cento."),
    claim("s2", "João foi prefeito de uma cidade brasileira."),
  ];

  assert.equal(claimsAreDuplicates(candidates[0], existing[0]), true);
  assert.deepEqual(filterNewRecoveredClaims(candidates, existing), [
    candidates[2],
  ]);
});
