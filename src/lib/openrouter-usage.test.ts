import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateJidduCreditSettlement,
  readOpenRouterUsage,
  type OpenRouterUsage,
} from "./openrouter-usage";

test("reads tokens and real OpenRouter cost from a completion", () => {
  const usage = readOpenRouterUsage(
    {
      id: "gen-1",
      usage: {
        prompt_tokens: 120,
        completion_tokens: 30,
        total_tokens: 150,
        cost: 0.012,
        prompt_tokens_details: { cached_tokens: 40 },
        completion_tokens_details: { reasoning_tokens: 5 },
        cost_details: { upstream_inference_cost: 0.01 },
      },
    },
    "gpt-5.4-mini",
  );

  assert.deepEqual(usage, {
    provider: "openrouter",
    model: "gpt-5.4-mini",
    generationId: "gen-1",
    completed: false,
    promptTokens: 120,
    completionTokens: 30,
    totalTokens: 150,
    reasoningTokens: 5,
    cachedTokens: 40,
    costUsd: 0.012,
    upstreamCostUsd: 0.01,
  });
});

test("converts real cost to credits with margin and only falls back when cost is missing", () => {
  const priced: OpenRouterUsage = {
    provider: "openrouter",
    model: "gpt-5.4-mini",
    generationId: "gen-1",
    completed: true,
    promptTokens: 100,
    completionTokens: 25,
    totalTokens: 125,
    reasoningTokens: 0,
    cachedTokens: 0,
    costUsd: 0.012,
    upstreamCostUsd: null,
  };

  const settlement = calculateJidduCreditSettlement(
    [priced],
    ["gpt-5.4-mini", "minimax-m3"],
    { marginMultiplier: 1.5, usdPerCredit: 0.01 },
  );

  assert.equal(settlement.providerCostMicros, 12_000);
  assert.equal(settlement.billedCostMicros, 18_000);
  assert.equal(settlement.fallbackCredits, 1);
  assert.deepEqual(settlement.fallbackModels, ["minimax-m3"]);
  assert.equal(settlement.credits, 3);
});

test("does not charge a cached zero-cost call", () => {
  const settlement = calculateJidduCreditSettlement(
    [
      {
        provider: "openrouter",
        model: "gpt-5.4-mini",
        generationId: "cached",
        completed: true,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        reasoningTokens: 0,
        cachedTokens: 0,
        costUsd: 0,
        upstreamCostUsd: 0,
      },
    ],
    ["gpt-5.4-mini"],
    { marginMultiplier: 2, usdPerCredit: 0.01 },
  );

  assert.equal(settlement.credits, 0);
  assert.equal(settlement.fallbackCredits, 0);
});
