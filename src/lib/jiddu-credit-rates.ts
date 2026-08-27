export const JIDDU_CREDIT_RATE_VERSION = "2026-08-26.v17";
export const DEFAULT_LIVE_MINIMUM_CREDITS = 20;

export const MODEL_CREDIT_RATES = {
  "gemma-4-31b-it": 1,
  // Legacy rates retained for historical usage records.
  "deepseek-v4-flash-0731": 1,
  "minimax-m3": 1,
  "gpt-5.6-luna": 1,
  "gpt-5.6-luna-pro": 3,
  "glm-5.3-flash": 1,
  "gpt-5.6-terra": 10,
  "gpt-5.6-terra-pro": 12,
  "gpt-5.6-sol": 10,
  "gpt-5.6-sol-pro": 12,
  "claude-sonnet-5": 10,
  "claude-opus-5": 25,
  // Legacy rates remain available for historical jobs and usage records.
  "gpt-5.4-mini": 2,
  "perplexity/sonar": 1,
  "perplexity/sonar-reasoning-pro": 2,
  "gpt-5.5": 10,
  "claude-opus-4.8": 18,
} as const;

export type JidduCreditFeature =
  | "fallacy"
  | "factcheck_api"
  | "factcheck_extract"
  | "factcheck_verify"
  | "neutrality"
  | "explain"
  | "slop"
  | "review_standard"
  | "review_deep"
  | "live_transcription"
  | "live_diarization"
  | "live_analysis";

export type CreditRateRow = {
  feature: string;
  unit: string;
  detail: string;
};

export const JIDDU_CREDIT_RATE_TABLE: CreditRateRow[] = [
  {
    feature: "Fallacy detector",
    unit: "Per completed text chunk",
    detail:
      "Credits are reserved from the more expensive of the admin-configured primary and fallback models; settlement uses the real provider cost when available.",
  },
  {
    feature: "Fact-check — extraction",
    unit: "Per completed text chunk",
    detail:
      "Credits are reserved from the more expensive of the admin-configured primary and fallback models; settlement uses the real provider cost when available.",
  },
  {
    feature: "Fact-check — verification",
    unit: "Per eligible claim search",
    detail:
      "1 credit is reserved for the default Sonar fast pass and 2 for Sonar Reasoning Pro. Cache hits settle at 0; uncached calls settle against the configured model.",
  },
  {
    feature: "Neutrality",
    unit: "Per completed text chunk",
    detail:
      "Credits are reserved from the more expensive of the admin-configured primary and fallback models; settlement uses the real provider cost when available.",
  },
  {
    feature: "Paper explainer",
    unit: "Per completed analysis call",
    detail:
      "One call per text chunk; papers with recognizable methods/results add one evidence-first reading and one final guided-reading synthesis. Reservation follows the configured model chain and settlement uses real provider cost when available.",
  },
  {
    feature: "Slop detector",
    unit: "Per completed text chunk",
    detail:
      "Credits are reserved from the more expensive of the admin-configured primary and fallback models; settlement uses the real provider cost when available.",
  },
  {
    feature: "Screenshot transcription",
    unit: "Per pasted or uploaded image",
    detail:
      "One vision call is billed before the selected text-analysis pipeline. The original image is not retained.",
  },
  {
    feature: "Adversarial review — Standard",
    unit: "Per review run",
    detail:
      "The maximum reservation follows the admin-configured primary model and the review stages that may run; settlement uses actual completed calls.",
  },
  {
    feature: "Adversarial review — Deep",
    unit: "Per review run",
    detail:
      "With default GPT-5.6 Luna Pro and Claude Opus 4.8 routing, up to 42 credits (39 without repair).",
  },
  {
    feature: "Live transcription",
    unit: "Per audio duration",
    detail: `${DEFAULT_LIVE_MINIMUM_CREDITS} available credits required to start. The final debit uses actual audio duration, OpenAI's configured per-minute rate and the standard cost multiplier.`,
  },
  {
    feature: "Live speaker identification",
    unit: "Per audio duration, when requested",
    detail:
      "The final debit uses the diarized recording duration, OpenAI's configured per-minute rate and the standard cost multiplier.",
  },
  {
    feature: "Live analysis",
    unit: "Per selected lens and completed analysis window",
    detail:
      "Reservation follows the more expensive admin-configured analysis model for each selected lens. Context enrichment uses its configured Perplexity model. Completed costs are accumulated with transcription and the Live session is rounded once at settlement.",
  },
];

const UNKNOWN_MODEL_RATE = 20;

export function modelCreditRate(modelId: string): number {
  return (
    MODEL_CREDIT_RATES[modelId as keyof typeof MODEL_CREDIT_RATES] ??
    UNKNOWN_MODEL_RATE
  );
}

export function creditsForModels(models: readonly string[]): number {
  return models.reduce((total, model) => total + modelCreditRate(model), 0);
}

export function maxCreditsForCalls(
  models: readonly string[],
  callCount: number,
): number {
  const highestRate = Math.max(0, ...models.map(modelCreditRate));
  return highestRate * Math.max(0, Math.floor(callCount));
}

export function paperReviewMaximumModels(input: {
  depth: "standard" | "deep";
  selectedModel: string;
  deepModel?: string;
  criticModel?: string;
}): string[] {
  const selected = input.selectedModel;
  if (input.depth === "standard") {
    const critic =
      selected === "gemma-4-31b-it"
        ? "gpt-5.6-luna"
        : "gemma-4-31b-it";
    return [
      ...Array.from({ length: 9 }, () => selected),
      critic,
      selected, // optional repair
    ];
  }

  const deep = input.deepModel || "gpt-5.6-luna-pro";
  const critic = input.criticModel || "claude-opus-4.8";
  return [
    ...Array.from({ length: 3 }, () => selected),
    ...Array.from({ length: 6 }, () => deep),
    critic,
    deep, // optional repair
  ];
}
