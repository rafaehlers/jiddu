import assert from "node:assert/strict";
import test from "node:test";
import {
  addLiveAnalysisUsage,
  calculateLiveTranscriptionSettlement,
  LIVE_TRANSCRIPTION_MAX_DURATION_MS,
  normalizeLiveDurationMs,
} from "./live-billing";
import type { JidduCreditSettlement } from "./openrouter-usage";

const config = {
  marginMultiplier: 1.5,
  usdPerCredit: 0.01,
  usdPerMinute: 0.017,
};

test("does not charge a Live session that never connected", () => {
  const settlement = calculateLiveTranscriptionSettlement(0, config);

  assert.equal(settlement.provider, "openai");
  assert.equal(settlement.credits, 0);
  assert.equal(settlement.providerCostMicros, 0);
});

test("converts actual Live duration to provider cost and Jiddu Credits", () => {
  const settlement = calculateLiveTranscriptionSettlement(60_000, config);

  assert.equal(settlement.durationMs, 60_000);
  assert.equal(settlement.providerCostMicros, 17_000);
  assert.equal(settlement.billedCostMicros, 25_500);
  assert.equal(settlement.credits, 3);
});

test("aggregates transcription and analysis cost before rounding once", () => {
  const settlement = calculateLiveTranscriptionSettlement(60_000, config, {
    providerCostMicros: 4_000,
    promptTokens: 100,
    completionTokens: 20,
    totalTokens: 120,
    analysisWindows: 2,
  });

  assert.equal(settlement.provider, "mixed");
  assert.equal(settlement.transcriptionProviderCostMicros, 17_000);
  assert.equal(settlement.analysisProviderCostMicros, 4_000);
  assert.equal(settlement.providerCostMicros, 21_000);
  assert.equal(settlement.billedCostMicros, 31_500);
  assert.equal(settlement.credits, 4);
  assert.equal(settlement.totalTokens, 120);
  assert.equal(settlement.analysisWindows, 2);
});

test("adds fallback credits after metered session cost", () => {
  const settlement = calculateLiveTranscriptionSettlement(60_000, config, {
    fallbackCredits: 2,
    fallbackModels: ["gpt-5.4-mini"],
    analysisWindows: 1,
  });

  assert.equal(settlement.credits, 5);
  assert.equal(settlement.fallbackCredits, 2);
  assert.deepEqual(settlement.fallbackModels, ["gpt-5.4-mini"]);
});

test("accumulates completed analysis windows without rounding them", () => {
  const empty = {
    providerCostMicros: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    reasoningTokens: 0,
    cachedTokens: 0,
    fallbackCredits: 0,
    fallbackModels: [],
    analysisWindows: 0,
  };
  const analysis = {
    provider: "openrouter",
    credits: 1,
    promptTokens: 80,
    completionTokens: 20,
    totalTokens: 100,
    reasoningTokens: 0,
    cachedTokens: 5,
    providerCostMicros: 2_000,
    billedCostMicros: 3_000,
    marginMultiplier: 1.5,
    usdPerCredit: 0.01,
    fallbackCredits: 0,
    fallbackModels: [],
    calls: [],
  } satisfies JidduCreditSettlement;

  const once = addLiveAnalysisUsage(empty, analysis);
  const twice = addLiveAnalysisUsage(once, analysis);

  assert.equal(twice.providerCostMicros, 4_000);
  assert.equal(twice.totalTokens, 200);
  assert.equal(twice.cachedTokens, 10);
  assert.equal(twice.analysisWindows, 2);
});

test("caps Live billing at the 60-minute session limit", () => {
  const settlement = calculateLiveTranscriptionSettlement(
    2 * LIVE_TRANSCRIPTION_MAX_DURATION_MS,
    config,
  );

  assert.equal(settlement.durationMs, LIVE_TRANSCRIPTION_MAX_DURATION_MS);
  assert.equal(settlement.providerCostMicros, 1_020_000);
  assert.equal(settlement.billedCostMicros, 1_530_000);
  assert.equal(settlement.credits, 153);
});

test("normalizes invalid, fractional and oversized durations", () => {
  assert.equal(normalizeLiveDurationMs(-1), 0);
  assert.equal(normalizeLiveDurationMs("1500.9"), 1500);
  assert.equal(
    normalizeLiveDurationMs(Number.POSITIVE_INFINITY),
    0,
  );
  assert.equal(
    normalizeLiveDurationMs(LIVE_TRANSCRIPTION_MAX_DURATION_MS + 1),
    LIVE_TRANSCRIPTION_MAX_DURATION_MS,
  );
});
