import assert from "node:assert/strict";
import test from "node:test";
import {
  includedPlatformUsage,
  onceAnalysisSettlement,
} from "./analysis-usage-policy";
import type { JidduCreditSettlement } from "./openrouter-usage";

const settlement: JidduCreditSettlement = {
  provider: "openrouter",
  credits: 3,
  promptTokens: 100,
  completionTokens: 50,
  totalTokens: 150,
  reasoningTokens: 20,
  cachedTokens: 10,
  providerCostMicros: 12_000,
  billedCostMicros: 18_000,
  marginMultiplier: 1.5,
  usdPerCredit: 0.01,
  fallbackCredits: 0,
  fallbackModels: [],
  calls: [
    {
      provider: "openrouter",
      model: "gpt-5.6-luna",
      generationId: "generation-1",
      completed: true,
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      reasoningTokens: 20,
      cachedTokens: 10,
      costUsd: 0.012,
      upstreamCostUsd: 0.008,
    },
  ],
};

test("plans included usage for platform access without a credit debit", () => {
  const result = includedPlatformUsage(
    {
      billing: "platform",
      userId: "user-1",
      email: "admin@example.com",
    },
    {
      feature: "review_standard",
      resourceId: "review-1",
      metadata: { calls: ["quality_audit"] },
    },
    settlement,
  );

  assert.deepEqual(result, {
    workosUserId: "user-1",
    email: "admin@example.com",
    feature: "review_standard",
    resourceId: "review-1",
    note: "Included platform access",
    metadata: { calls: ["quality_audit"] },
    usage: settlement,
  });
});

test("skips included usage for credit billing or a run without provider work", () => {
  assert.equal(
    includedPlatformUsage(
      { billing: "jiddu", userId: "user-1", email: "user@example.com" },
      { feature: "explain", resourceId: "explain-1" },
      settlement,
    ),
    null,
  );
  assert.equal(
    includedPlatformUsage(
      { billing: "platform", userId: "user-1", email: "admin@example.com" },
      { feature: "slop", resourceId: "slop-1" },
      { ...settlement, calls: [], fallbackModels: [] },
    ),
    null,
  );
});

test("records fallback-only provider work when usage details are unavailable", () => {
  const fallbackOnlySettlement: JidduCreditSettlement = {
    ...settlement,
    credits: 1,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    reasoningTokens: 0,
    cachedTokens: 0,
    providerCostMicros: 0,
    billedCostMicros: 0,
    fallbackCredits: 1,
    fallbackModels: ["minimax-m3"],
    calls: [],
  };

  assert.deepEqual(
    includedPlatformUsage(
      {
        billing: "platform",
        userId: "user-1",
        email: "admin@example.com",
      },
      { feature: "review_standard", resourceId: "review-1" },
      fallbackOnlySettlement,
    ),
    {
      workosUserId: "user-1",
      email: "admin@example.com",
      feature: "review_standard",
      resourceId: "review-1",
      note: "Included platform access",
      metadata: undefined,
      usage: fallbackOnlySettlement,
    },
  );
});

test("refuses to create unattributed platform usage", () => {
  assert.throws(
    () =>
      includedPlatformUsage(
        { billing: "platform" },
        { feature: "explain", resourceId: "explain-1" },
        settlement,
      ),
    /identified account/,
  );
});

test("settles an analysis only once across completion and cancellation races", async () => {
  let calls = 0;
  const settle = onceAnalysisSettlement(async (outcome: string) => {
    calls += 1;
    await Promise.resolve();
    return outcome;
  });

  const [completed, cancelled] = await Promise.all([
    settle("completed"),
    settle("cancelled"),
  ]);

  assert.equal(calls, 1);
  assert.equal(completed, "completed");
  assert.equal(cancelled, "completed");
});
