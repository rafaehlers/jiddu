import { modelCreditRate } from "@/lib/jiddu-credit-rates";

export type OpenRouterUsage = {
  provider: "openrouter";
  model: string;
  generationId: string | null;
  completed: boolean;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  reasoningTokens: number;
  cachedTokens: number;
  costUsd: number | null;
  upstreamCostUsd: number | null;
};

export type JidduCreditSettlement = {
  provider: "openrouter" | "openai" | "mixed";
  credits: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  reasoningTokens: number;
  cachedTokens: number;
  providerCostMicros: number;
  billedCostMicros: number;
  marginMultiplier: number;
  usdPerCredit: number;
  fallbackCredits: number;
  fallbackModels: string[];
  calls: OpenRouterUsage[];
};

const DEFAULT_MARGIN_MULTIPLIER = 1.5;
const DEFAULT_USD_PER_CREDIT = 0.01;

export function readOpenRouterUsage(
  response: unknown,
  model: string,
): OpenRouterUsage | null {
  const root = asRecord(response);
  const usage = asRecord(root?.usage);
  if (!usage) return null;

  const promptDetails = asRecord(usage.prompt_tokens_details);
  const completionDetails = asRecord(usage.completion_tokens_details);
  const costDetails = asRecord(usage.cost_details);

  return {
    provider: "openrouter",
    model,
    generationId: typeof root?.id === "string" ? root.id : null,
    completed: false,
    promptTokens: nonNegativeInteger(usage.prompt_tokens),
    completionTokens: nonNegativeInteger(usage.completion_tokens),
    totalTokens: nonNegativeInteger(usage.total_tokens),
    reasoningTokens: nonNegativeInteger(completionDetails?.reasoning_tokens),
    cachedTokens: nonNegativeInteger(promptDetails?.cached_tokens),
    costUsd: nonNegativeNumberOrNull(usage.cost),
    upstreamCostUsd: nonNegativeNumberOrNull(
      costDetails?.upstream_inference_cost,
    ),
  };
}

export function calculateJidduCreditSettlement(
  calls: readonly OpenRouterUsage[],
  fallbackModels: readonly string[],
  config?: {
    marginMultiplier?: number;
    usdPerCredit?: number;
  },
): JidduCreditSettlement {
  const marginMultiplier = positiveNumber(
    config?.marginMultiplier ??
      process.env.JIDDU_CREDIT_MARGIN_MULTIPLIER,
    DEFAULT_MARGIN_MULTIPLIER,
  );
  const usdPerCredit = positiveNumber(
    config?.usdPerCredit ?? process.env.JIDDU_CREDIT_USD_VALUE,
    DEFAULT_USD_PER_CREDIT,
  );

  const pricedCalls = calls.filter((call) => call.costUsd !== null);
  const pricedCallsByModel = new Map<string, number>();
  for (const call of pricedCalls.filter((item) => item.completed)) {
    pricedCallsByModel.set(
      call.model,
      (pricedCallsByModel.get(call.model) ?? 0) + 1,
    );
  }

  const unmatchedFallbackModels: string[] = [];
  for (const model of fallbackModels) {
    const remaining = pricedCallsByModel.get(model) ?? 0;
    if (remaining > 0) {
      pricedCallsByModel.set(model, remaining - 1);
    } else {
      unmatchedFallbackModels.push(model);
    }
  }

  const providerCostUsd = pricedCalls.reduce(
    (sum, call) => sum + (call.costUsd ?? 0),
    0,
  );
  const billedCostUsd = providerCostUsd * marginMultiplier;
  const meteredCredits =
    providerCostUsd > 0 ? Math.max(1, Math.ceil(billedCostUsd / usdPerCredit)) : 0;
  const fallbackCredits = unmatchedFallbackModels.reduce(
    (sum, model) => sum + modelCreditRate(model),
    0,
  );

  return {
    provider: "openrouter",
    credits: meteredCredits + fallbackCredits,
    promptTokens: calls.reduce((sum, call) => sum + call.promptTokens, 0),
    completionTokens: calls.reduce(
      (sum, call) => sum + call.completionTokens,
      0,
    ),
    totalTokens: calls.reduce((sum, call) => sum + call.totalTokens, 0),
    reasoningTokens: calls.reduce(
      (sum, call) => sum + call.reasoningTokens,
      0,
    ),
    cachedTokens: calls.reduce((sum, call) => sum + call.cachedTokens, 0),
    providerCostMicros: Math.round(providerCostUsd * 1_000_000),
    billedCostMicros: Math.round(billedCostUsd * 1_000_000),
    marginMultiplier,
    usdPerCredit,
    fallbackCredits,
    fallbackModels: unmatchedFallbackModels,
    calls: [...calls],
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function nonNegativeInteger(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

function nonNegativeNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function positiveNumber(value: unknown, fallback: number): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
