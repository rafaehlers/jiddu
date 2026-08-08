export const JIDDU_CREDIT_RATE_VERSION = "2026-08-08.v14";
export const DEFAULT_LIVE_MINIMUM_CREDITS = 20;

export const MODEL_CREDIT_RATES = {
  "minimax-m3": 1,
  "gpt-5.6-luna": 1,
  "gpt-5.6-luna-pro": 3,
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
      "1 credit reserved per call. If cost data is missing, a completed GPT-5.6 Luna or MiniMax M3 call falls back to 1 credit.",
  },
  {
    feature: "Fact-check — extraction",
    unit: "Per completed text chunk",
    detail:
      "1 credit reserved per call. If cost data is missing, a completed GPT-5.6 Luna or MiniMax M3 call falls back to 1 credit.",
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
      "1 credit reserved per call. If cost data is missing, a completed GPT-5.6 Luna or MiniMax M3 call falls back to 1 credit.",
  },
  {
    feature: "Paper explainer",
    unit: "Per completed analysis call",
    detail:
      "One call per text chunk; papers with recognizable methods/results add one evidence-first reading and one final guided-reading synthesis. If cost data is missing, a completed GPT-5.6 Luna or MiniMax M3 call falls back to 1 credit.",
  },
  {
    feature: "Slop detector",
    unit: "Per completed text chunk",
    detail:
      "1 credit reserved per call. If cost data is missing, a completed GPT-5.6 Luna or MiniMax M3 call falls back to 1 credit.",
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
      "Up to 11 credits with GPT-5.6 Luna or MiniMax M3 (10 without repair).",
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
      "1 credit reserved per selected lens with GPT-5.6 Luna or MiniMax M3, up to 4 with all lenses. Context enrichment uses its configured Perplexity model (1 credit for Sonar, 2 for Reasoning Pro). Completed costs are accumulated with transcription and the Live session is rounded once at settlement.",
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
      input.criticModel ??
      (selected === "minimax-m3" ? "gpt-5.6-luna" : "minimax-m3");
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
