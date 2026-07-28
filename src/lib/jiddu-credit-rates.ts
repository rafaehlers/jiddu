export const JIDDU_CREDIT_RATE_VERSION = "2026-07-28.v4";

export const MODEL_CREDIT_RATES = {
  "minimax-m3": 1,
  "gpt-5.4-mini": 2,
  "perplexity/sonar-reasoning-pro": 2,
  "gpt-5.5": 10,
  "claude-opus-4.8": 18,
  "gpt-live-transcribe": 20,
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
    detail: "1 credit with MiniMax M3; 2 with GPT-5.4 mini.",
  },
  {
    feature: "Fact-check — extraction",
    unit: "Per completed text chunk",
    detail: "1 credit with MiniMax M3; 2 with GPT-5.4 mini.",
  },
  {
    feature: "Fact-check — verification",
    unit: "Per uncached claim search",
    detail: "2 credits for each Sonar Reasoning Pro call; cache hits are free.",
  },
  {
    feature: "Neutrality",
    unit: "Per completed text chunk",
    detail: "1 credit with MiniMax M3; 2 with GPT-5.4 mini.",
  },
  {
    feature: "Paper explainer",
    unit: "Per completed text chunk",
    detail: "1 credit with MiniMax M3; 2 with GPT-5.4 mini.",
  },
  {
    feature: "Slop detector",
    unit: "Per completed text chunk",
    detail: "1 credit with MiniMax M3; 2 with GPT-5.4 mini.",
  },
  {
    feature: "Adversarial review — Standard",
    unit: "Per successful model call",
    detail:
      "Usually 19–21 credits with GPT-5.4 mini or 10–11 with MiniMax M3; optional repair is charged only when used.",
  },
  {
    feature: "Adversarial review — Deep",
    unit: "Per successful model call",
    detail:
      "Usually 84–94 credits: selected-model stages plus GPT-5.5 reasoning and Claude Opus 4.8 critique.",
  },
  {
    feature: "Live transcription",
    unit: "Per Realtime session",
    detail:
      "20 credits for one GPT Live Transcribe session, capped at 60 minutes.",
  },
  {
    feature: "Live analysis",
    unit: "Per completed analysis window",
    detail: "1 credit with MiniMax M3; 2 with GPT-5.4 mini.",
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
      (selected === "minimax-m3" ? "gpt-5.4-mini" : "minimax-m3");
    return [
      ...Array.from({ length: 9 }, () => selected),
      critic,
      selected, // optional repair
    ];
  }

  const deep = input.deepModel || "gpt-5.5";
  const critic = input.criticModel || "claude-opus-4.8";
  return [
    ...Array.from({ length: 3 }, () => selected),
    ...Array.from({ length: 6 }, () => deep),
    critic,
    deep, // optional repair
  ];
}
