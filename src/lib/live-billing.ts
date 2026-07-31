import type { JidduCreditSettlement } from "@/lib/openrouter-usage";

export const LIVE_TRANSCRIPTION_MODEL = "gpt-live-transcribe";
export const LIVE_TRANSCRIPTION_MAX_DURATION_MS = 60 * 60 * 1000;
export const DEFAULT_LIVE_TRANSCRIPTION_USD_PER_MINUTE = 0.017;

type LiveTranscriptionBillingConfig = {
  marginMultiplier: number;
  usdPerCredit: number;
  usdPerMinute?: number;
  maxDurationMs?: number;
};

export type LiveAnalysisUsageTotals = {
  providerCostMicros: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  reasoningTokens: number;
  cachedTokens: number;
  fallbackCredits: number;
  fallbackModels: string[];
  analysisWindows: number;
};

export type LiveTranscriptionSettlement = JidduCreditSettlement & {
  durationMs: number;
  usdPerMinute: number;
  transcriptionProviderCostMicros: number;
  analysisProviderCostMicros: number;
  analysisWindows: number;
};

export function addLiveAnalysisUsage(
  current: LiveAnalysisUsageTotals,
  settlement: JidduCreditSettlement,
): LiveAnalysisUsageTotals {
  const hasBillableUsage =
    settlement.providerCostMicros > 0 ||
    settlement.fallbackCredits > 0 ||
    settlement.totalTokens > 0;
  return {
    providerCostMicros:
      current.providerCostMicros + settlement.providerCostMicros,
    promptTokens: current.promptTokens + settlement.promptTokens,
    completionTokens:
      current.completionTokens + settlement.completionTokens,
    totalTokens: current.totalTokens + settlement.totalTokens,
    reasoningTokens: current.reasoningTokens + settlement.reasoningTokens,
    cachedTokens: current.cachedTokens + settlement.cachedTokens,
    fallbackCredits: current.fallbackCredits + settlement.fallbackCredits,
    fallbackModels: [
      ...current.fallbackModels,
      ...settlement.fallbackModels,
    ],
    analysisWindows:
      current.analysisWindows + (hasBillableUsage ? 1 : 0),
  };
}

export function calculateLiveTranscriptionSettlement(
  durationMs: number,
  config: LiveTranscriptionBillingConfig,
  analysisUsage?: Partial<LiveAnalysisUsageTotals>,
): LiveTranscriptionSettlement {
  const maxDurationMs = positiveNumber(
    config.maxDurationMs,
    LIVE_TRANSCRIPTION_MAX_DURATION_MS,
  );
  const normalizedDurationMs = Math.min(
    maxDurationMs,
    nonNegativeInteger(durationMs),
  );
  const usdPerMinute = positiveNumber(
    config.usdPerMinute,
    DEFAULT_LIVE_TRANSCRIPTION_USD_PER_MINUTE,
  );
  const marginMultiplier = positiveNumber(config.marginMultiplier, 1.5);
  const usdPerCredit = positiveNumber(config.usdPerCredit, 0.01);
  const transcriptionProviderCostUsd =
    (normalizedDurationMs / (60 * 1000)) * usdPerMinute;
  const analysisProviderCostMicros = nonNegativeInteger(
    analysisUsage?.providerCostMicros,
  );
  const analysisProviderCostUsd = analysisProviderCostMicros / 1_000_000;
  const providerCostUsd =
    transcriptionProviderCostUsd + analysisProviderCostUsd;
  const billedCostUsd = providerCostUsd * marginMultiplier;
  const meteredCredits =
    providerCostUsd > 0
      ? Math.max(1, Math.ceil(billedCostUsd / usdPerCredit))
      : 0;
  const fallbackCredits = nonNegativeInteger(analysisUsage?.fallbackCredits);
  const analysisWindows = nonNegativeInteger(analysisUsage?.analysisWindows);

  return {
    provider:
      analysisProviderCostMicros > 0 ||
      fallbackCredits > 0 ||
      analysisWindows > 0
        ? "mixed"
        : "openai",
    credits: meteredCredits + fallbackCredits,
    durationMs: normalizedDurationMs,
    usdPerMinute,
    transcriptionProviderCostMicros: Math.round(
      transcriptionProviderCostUsd * 1_000_000,
    ),
    analysisProviderCostMicros,
    analysisWindows,
    promptTokens: nonNegativeInteger(analysisUsage?.promptTokens),
    completionTokens: nonNegativeInteger(analysisUsage?.completionTokens),
    totalTokens: nonNegativeInteger(analysisUsage?.totalTokens),
    reasoningTokens: nonNegativeInteger(analysisUsage?.reasoningTokens),
    cachedTokens: nonNegativeInteger(analysisUsage?.cachedTokens),
    providerCostMicros: Math.round(providerCostUsd * 1_000_000),
    billedCostMicros: Math.round(billedCostUsd * 1_000_000),
    marginMultiplier,
    usdPerCredit,
    fallbackCredits,
    fallbackModels: normalizeFallbackModels(analysisUsage?.fallbackModels),
    calls: [],
  };
}

export function normalizeLiveDurationMs(value: unknown): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;
  return Math.min(
    LIVE_TRANSCRIPTION_MAX_DURATION_MS,
    nonNegativeInteger(parsed),
  );
}

function nonNegativeInteger(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

function positiveNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function normalizeFallbackModels(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
