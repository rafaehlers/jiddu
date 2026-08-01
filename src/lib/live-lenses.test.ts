import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_LIVE_LENSES,
  normalizeLiveLenses,
} from "./live-lenses";

test("defaults new Live sessions to all three lenses", () => {
  assert.deepEqual(DEFAULT_LIVE_LENSES, [
    "fallacy",
    "factcheck",
    "neutrality",
  ]);
});

test("normalizes requested lenses without forcing fallacy", () => {
  assert.deepEqual(normalizeLiveLenses(["neutrality", "neutrality"]), [
    "neutrality",
  ]);
  assert.deepEqual(normalizeLiveLenses(["invalid"]), ["fallacy"]);
  assert.deepEqual(normalizeLiveLenses([]), ["fallacy"]);
  assert.deepEqual(normalizeLiveLenses(undefined), ["fallacy"]);
});
