import type { JidduCreditSettlement } from "@/lib/openrouter-usage";

export const DEFAULT_LIVE_DIARIZATION_USD_PER_MINUTE = 0.006;

export type LiveDiarizationSettlement = JidduCreditSettlement & {
  durationSeconds: number;
  usdPerMinute: number;
};

export type LiveDiarizationBillingConfig = {
  marginMultiplier: number;
  usdPerCredit: number;
  usdPerMinute?: number;
};

export function calculateLiveDiarizationSettlement(
  durationSeconds: number,
  config: LiveDiarizationBillingConfig,
): LiveDiarizationSettlement {
  const normalizedDurationSeconds = nonNegativeNumber(durationSeconds);
  const usdPerMinute = positiveNumber(
    config.usdPerMinute,
    DEFAULT_LIVE_DIARIZATION_USD_PER_MINUTE,
  );
  const marginMultiplier = positiveNumber(config.marginMultiplier, 1.5);
  const usdPerCredit = positiveNumber(config.usdPerCredit, 0.01);
  const providerCostUsd = (normalizedDurationSeconds / 60) * usdPerMinute;
  const billedCostUsd = providerCostUsd * marginMultiplier;

  return {
    provider: "openai",
    credits:
      providerCostUsd > 0
        ? Math.max(1, Math.ceil(billedCostUsd / usdPerCredit))
        : 0,
    durationSeconds: normalizedDurationSeconds,
    usdPerMinute,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    reasoningTokens: 0,
    cachedTokens: 0,
    providerCostMicros: Math.round(providerCostUsd * 1_000_000),
    billedCostMicros: Math.round(billedCostUsd * 1_000_000),
    marginMultiplier,
    usdPerCredit,
    fallbackCredits: 0,
    fallbackModels: [],
    calls: [],
  };
}

function nonNegativeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, value)
    : 0;
}

function positiveNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}
