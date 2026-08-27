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
  assert.equal(modelCreditRate("gemma-4-31b-it"), 1);
  // Historical DeepSeek and MiniMax usage still needs deterministic rates.
  assert.equal(modelCreditRate("deepseek-v4-flash-0731"), 1);
  assert.equal(modelCreditRate("minimax-m3"), 1);
  assert.equal(modelCreditRate("gpt-5.6-luna"), 1);
  assert.equal(modelCreditRate("gpt-5.6-luna-pro"), 3);
  assert.equal(modelCreditRate("glm-5.3-flash"), 1);
  assert.equal(modelCreditRate("gpt-5.6-sol"), 10);
  assert.equal(modelCreditRate("claude-opus-5"), 25);
  assert.equal(modelCreditRate("perplexity/sonar"), 1);
  assert.equal(modelCreditRate("perplexity/sonar-reasoning-pro"), 2);
  assert.equal(modelCreditRate("claude-opus-4.8"), 18);
});

test("keeps the Live entry check separate from model fallback pricing", () => {
  assert.equal(DEFAULT_LIVE_MINIMUM_CREDITS, 20);
});

test("reserves the worst possible fallback cost but settles actual models", () => {
  assert.equal(
    maxCreditsForCalls(
      ["gpt-5.6-luna", "gemma-4-31b-it"],
      3,
    ),
    3,
  );
  assert.equal(
    creditsForModels([
      "gpt-5.6-luna",
      "gemma-4-31b-it",
      "gemma-4-31b-it",
    ]),
    3,
  );
});

test("standard paper review includes ten required calls and optional repair", () => {
  const gptModels = paperReviewMaximumModels({
    depth: "standard",
    selectedModel: "gpt-5.6-luna",
  });
  assert.equal(gptModels.length, 11);
  assert.equal(creditsForModels(gptModels), 11);

  const gemmaModels = paperReviewMaximumModels({
    depth: "standard",
    selectedModel: "gemma-4-31b-it",
    // Admin critic settings apply only to Deep review. Standard execution
    // always uses the economical model from the other public family.
    criticModel: "claude-opus-4.8",
  });
  assert.equal(gemmaModels.length, 11);
  assert.equal(creditsForModels(gemmaModels), 11);
});

test("deep paper review reserves selected, reasoning, critic and repair calls", () => {
  const gptModels = paperReviewMaximumModels({
    depth: "deep",
    selectedModel: "gpt-5.6-luna",
  });
  assert.equal(gptModels.length, 11);
  assert.equal(creditsForModels(gptModels), 42);

  const gemmaModels = paperReviewMaximumModels({
    depth: "deep",
    selectedModel: "gemma-4-31b-it",
  });
  assert.equal(gemmaModels.length, 11);
  assert.equal(creditsForModels(gemmaModels), 42);
});
