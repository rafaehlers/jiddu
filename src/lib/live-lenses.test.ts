import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_LIVE_LENSES,
  normalizeLiveLenses,
} from "./live-lenses";

test("defaults new Live sessions to all four lenses", () => {
  assert.deepEqual(DEFAULT_LIVE_LENSES, [
    "context",
    "fallacy",
    "factcheck",
    "neutrality",
  ]);
});

test("normalizes requested lenses without forcing fallacy", () => {
  assert.deepEqual(normalizeLiveLenses(["neutrality", "neutrality"]), [
    "neutrality",
  ]);
  assert.deepEqual(normalizeLiveLenses(["invalid"]), ["context"]);
  assert.deepEqual(normalizeLiveLenses([]), ["context"]);
  assert.deepEqual(normalizeLiveLenses(undefined), ["context"]);
});
