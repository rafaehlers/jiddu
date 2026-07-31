import assert from "node:assert/strict";
import test from "node:test";
import {
  creditsForModels,
  DEFAULT_LIVE_MINIMUM_CREDITS,
  maxCreditsForCalls,
  modelCreditRate,
  paperReviewMaximumModels,
} from "./jiddu-credit-rates";

test("prices economical, reasoning and critic models distinctly", () => {
  assert.equal(modelCreditRate("minimax-m3"), 1);
  assert.equal(modelCreditRate("gpt-5.4-mini"), 2);
  assert.equal(modelCreditRate("gpt-5.5"), 10);
  assert.equal(modelCreditRate("claude-opus-4.8"), 18);
});

test("keeps the Live entry check separate from model fallback pricing", () => {
  assert.equal(DEFAULT_LIVE_MINIMUM_CREDITS, 20);
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
  const gptModels = paperReviewMaximumModels({
    depth: "standard",
    selectedModel: "gpt-5.4-mini",
  });
  assert.equal(gptModels.length, 11);
  assert.equal(creditsForModels(gptModels), 21);

  const minimaxModels = paperReviewMaximumModels({
    depth: "standard",
    selectedModel: "minimax-m3",
  });
  assert.equal(minimaxModels.length, 11);
  assert.equal(creditsForModels(minimaxModels), 12);
});

test("deep paper review reserves selected, reasoning, critic and repair calls", () => {
  const gptModels = paperReviewMaximumModels({
    depth: "deep",
    selectedModel: "gpt-5.4-mini",
  });
  assert.equal(gptModels.length, 11);
  assert.equal(creditsForModels(gptModels), 94);

  const minimaxModels = paperReviewMaximumModels({
    depth: "deep",
    selectedModel: "minimax-m3",
  });
  assert.equal(minimaxModels.length, 11);
  assert.equal(creditsForModels(minimaxModels), 91);
});
