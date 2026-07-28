import assert from "node:assert/strict";
import test from "node:test";
import {
  creditsForModels,
  maxCreditsForCalls,
  modelCreditRate,
  paperReviewMaximumModels,
} from "./jiddu-credit-rates";

test("prices economical, reasoning, critic and realtime models distinctly", () => {
  assert.equal(modelCreditRate("minimax-m3"), 1);
  assert.equal(modelCreditRate("gpt-5.4-mini"), 2);
  assert.equal(modelCreditRate("gpt-5.5"), 10);
  assert.equal(modelCreditRate("claude-opus-4.8"), 18);
  assert.equal(modelCreditRate("gpt-live-transcribe"), 20);
});

test("reserves the worst possible fallback cost but settles actual models", () => {
  assert.equal(
    maxCreditsForCalls(["gpt-5.4-mini", "minimax-m3"], 3),
    6,
  );
  assert.equal(
    creditsForModels(["gpt-5.4-mini", "minimax-m3", "minimax-m3"]),
    4,
  );
});

test("standard paper review includes ten required calls and optional repair", () => {
  const models = paperReviewMaximumModels({
    depth: "standard",
    selectedModel: "gpt-5.4-mini",
  });
  assert.equal(models.length, 11);
  assert.equal(creditsForModels(models), 21);
});

test("deep paper review reserves selected, reasoning, critic and repair calls", () => {
  const models = paperReviewMaximumModels({
    depth: "deep",
    selectedModel: "gpt-5.4-mini",
  });
  assert.equal(models.length, 11);
  assert.equal(creditsForModels(models), 94);
});
