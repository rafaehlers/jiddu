import type { ProviderId } from "@/lib/llm/types";

export type ReasoningEffort = "low" | "medium" | "high" | "xhigh";

export type ProviderRoutingPreference =
  | "auto"
  | "price"
  | "latency"
  | "throughput"
  | string;

export type ModelProviderOption = {
  id: string;
  label: string;
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
  note?: string;
};

export type ModelChoice = {
  id: string;
  label: string;
  flag?: string;
  family:
    | ProviderId
    | "google"
    | "meta"
    | "mistral"
    | "deepseek"
    | "qwen"
    | "moonshot"
    | "zhipu";
  openrouter: string;
  toolMode?: "forced" | "auto";
  providerOrder?: string[];
  requireParameters?: boolean;
  reasoningEffort?: ReasoningEffort;
  supportsVision?: boolean;
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
  providers: ModelProviderOption[];
};

const openAiProviders = (
  input: number,
  output: number,
): ModelProviderOption[] => [
  {
    id: "openai/flex",
    label: "OpenAI Flex — lower cost",
    inputUsdPerMillion: input / 2,
    outputUsdPerMillion: output / 2,
    note: "Lower-cost OpenAI processing with variable latency",
  },
  {
    id: "openai",
    label: "OpenAI",
    inputUsdPerMillion: input,
    outputUsdPerMillion: output,
  },
  {
    id: "azure",
    label: "Azure",
    inputUsdPerMillion: input,
    outputUsdPerMillion: output,
  },
];

const anthropicProviders = (
  input: number,
  output: number,
): ModelProviderOption[] => [
  {
    id: "anthropic",
    label: "Anthropic",
    inputUsdPerMillion: input,
    outputUsdPerMillion: output,
  },
  {
    id: "claude-on-aws",
    label: "Claude on AWS",
    inputUsdPerMillion: input,
    outputUsdPerMillion: output,
  },
  {
    id: "google-vertex/global",
    label: "Google Vertex — global",
    inputUsdPerMillion: input,
    outputUsdPerMillion: output,
  },
  {
    id: "azure/global",
    label: "Azure — global",
    inputUsdPerMillion: input,
    outputUsdPerMillion: output,
  },
];

export const ANALYSIS_MODEL_CATALOG: ModelChoice[] = [
  {
    id: "glm-5.3-flash",
    label: "GLM-5.3 Flash",
    flag: "🇨🇳",
    family: "zhipu",
    openrouter: "z-ai/glm-5.3-flash",
    requireParameters: true,
    reasoningEffort: "high",
    supportsVision: true,
    inputUsdPerMillion: 0.075,
    outputUsdPerMillion: 0.25,
    providers: [
      { id: "z-ai/fp8", label: "Z.AI", inputUsdPerMillion: 0.075, outputUsdPerMillion: 0.25 },
      { id: "novita/fp8", label: "NovitaAI", inputUsdPerMillion: 0.075, outputUsdPerMillion: 0.25 },
      { id: "gmicloud/fp8", label: "GMICloud", inputUsdPerMillion: 0.075, outputUsdPerMillion: 0.25 },
      { id: "cloudflare", label: "Cloudflare", inputUsdPerMillion: 0.15, outputUsdPerMillion: 0.5 },
      { id: "deepinfra/fp8", label: "DeepInfra", inputUsdPerMillion: 0.15, outputUsdPerMillion: 0.5 },
      { id: "io-net/fp8", label: "io.net", inputUsdPerMillion: 0.15, outputUsdPerMillion: 0.5 },
      { id: "baseten/fp8", label: "Baseten", inputUsdPerMillion: 0.15, outputUsdPerMillion: 0.5 },
    ],
  },
  {
    id: "gpt-5.6-luna",
    label: "GPT-5.6 Luna",
    flag: "🇺🇸",
    family: "openai",
    openrouter: "openai/gpt-5.6-luna",
    requireParameters: true,
    reasoningEffort: "high",
    supportsVision: true,
    inputUsdPerMillion: 0.2,
    outputUsdPerMillion: 1.2,
    providers: openAiProviders(0.2, 1.2),
  },
  {
    id: "gpt-5.6-luna-pro",
    label: "GPT-5.6 Luna Pro",
    flag: "🇺🇸",
    family: "openai",
    openrouter: "openai/gpt-5.6-luna-pro",
    requireParameters: true,
    reasoningEffort: "xhigh",
    supportsVision: true,
    inputUsdPerMillion: 0.2,
    outputUsdPerMillion: 1.2,
    providers: openAiProviders(0.2, 1.2),
  },
  {
    id: "gpt-5.6-terra",
    label: "GPT-5.6 Terra",
    flag: "🇺🇸",
    family: "openai",
    openrouter: "openai/gpt-5.6-terra",
    requireParameters: true,
    reasoningEffort: "high",
    supportsVision: true,
    inputUsdPerMillion: 2,
    outputUsdPerMillion: 12,
    providers: openAiProviders(2, 12),
  },
  {
    id: "gpt-5.6-terra-pro",
    label: "GPT-5.6 Terra Pro",
    flag: "🇺🇸",
    family: "openai",
    openrouter: "openai/gpt-5.6-terra-pro",
    requireParameters: true,
    reasoningEffort: "xhigh",
    supportsVision: true,
    inputUsdPerMillion: 2,
    outputUsdPerMillion: 12,
    providers: openAiProviders(2, 12),
  },
  {
    id: "gpt-5.6-sol",
    label: "GPT-5.6 Sol",
    flag: "🇺🇸",
    family: "openai",
    openrouter: "openai/gpt-5.6-sol",
    requireParameters: true,
    reasoningEffort: "high",
    supportsVision: true,
    inputUsdPerMillion: 2,
    outputUsdPerMillion: 10,
    providers: openAiProviders(2, 10),
  },
  {
    id: "gpt-5.6-sol-pro",
    label: "GPT-5.6 Sol Pro",
    flag: "🇺🇸",
    family: "openai",
    openrouter: "openai/gpt-5.6-sol-pro",
    requireParameters: true,
    reasoningEffort: "xhigh",
    supportsVision: true,
    inputUsdPerMillion: 2,
    outputUsdPerMillion: 10,
    providers: openAiProviders(2, 10),
  },
  {
    id: "claude-sonnet-5",
    label: "Claude Sonnet 5",
    flag: "🇺🇸",
    family: "anthropic",
    openrouter: "anthropic/claude-sonnet-5",
    requireParameters: true,
    reasoningEffort: "high",
    supportsVision: true,
    inputUsdPerMillion: 2,
    outputUsdPerMillion: 10,
    providers: anthropicProviders(2, 10),
  },
  {
    id: "claude-opus-5",
    label: "Claude Opus 5",
    flag: "🇺🇸",
    family: "anthropic",
    openrouter: "anthropic/claude-opus-5",
    requireParameters: true,
    reasoningEffort: "high",
    supportsVision: true,
    inputUsdPerMillion: 5,
    outputUsdPerMillion: 25,
    providers: anthropicProviders(5, 25),
  },
  {
    id: "gemma-4-31b-it",
    label: "Gemma 4 31B",
    flag: "🇺🇸",
    family: "google",
    openrouter: "google/gemma-4-31b-it",
    requireParameters: true,
    supportsVision: true,
    inputUsdPerMillion: 0.1,
    outputUsdPerMillion: 0.34,
    providers: [
      { id: "coreweave/fp4", label: "CoreWeave", inputUsdPerMillion: 0.1, outputUsdPerMillion: 0.34 },
      { id: "venice/bf16", label: "Venice", inputUsdPerMillion: 0.12, outputUsdPerMillion: 0.4 },
      { id: "chutes/fp4", label: "Chutes", inputUsdPerMillion: 0.12, outputUsdPerMillion: 0.4 },
      { id: "deepinfra/fp8", label: "DeepInfra", inputUsdPerMillion: 0.15, outputUsdPerMillion: 0.5 },
    ],
  },
];

export const GENERAL_PROVIDER_ROUTING_OPTIONS = [
  { id: "price", label: "Cheapest compatible — OpenRouter" },
  { id: "auto", label: "Automatic — balanced" },
  { id: "latency", label: "Lowest latency" },
  { id: "throughput", label: "Highest throughput" },
] as const;

const MODEL_BY_ID = new Map(
  ANALYSIS_MODEL_CATALOG.map((model) => [model.id, model]),
);

export const DEFAULT_ANALYSIS_MODEL_ID = "gpt-5.6-luna";
export const DEFAULT_ANALYSIS_FALLBACK_MODEL_ID = "gemma-4-31b-it";
export const DEFAULT_PROVIDER_ROUTING = "price";

export function resolveAnalysisModel(id?: string | null): ModelChoice {
  return (
    (id ? MODEL_BY_ID.get(id) : undefined) ??
    MODEL_BY_ID.get(DEFAULT_ANALYSIS_MODEL_ID)!
  );
}

export function isAnalysisModelId(value: string): boolean {
  return MODEL_BY_ID.has(value);
}

export function providerOptionsForModel(modelId: string) {
  return resolveAnalysisModel(modelId).providers;
}

export function isProviderRoutingPreferenceForModel(
  modelId: string,
  value: string,
): boolean {
  return (
    GENERAL_PROVIDER_ROUTING_OPTIONS.some((option) => option.id === value) ||
    providerOptionsForModel(modelId).some((provider) => provider.id === value)
  );
}

export function providerRoutingPayload(
  modelId: string,
  preference?: ProviderRoutingPreference,
): Record<string, unknown> {
  const choice = resolveAnalysisModel(modelId);
  if (choice.providerOrder?.length) {
    return {
      order: choice.providerOrder,
      allow_fallbacks: false,
      ...(choice.requireParameters ? { require_parameters: true } : {}),
    };
  }
  const base = {
    allow_fallbacks: true,
    ...(choice.requireParameters ? { require_parameters: true } : {}),
  };
  if (!preference || preference === "auto") return base;
  if (["price", "latency", "throughput"].includes(preference)) {
    return { ...base, sort: preference };
  }
  if (choice.providers.some((provider) => provider.id === preference)) {
    return { ...base, order: [preference] };
  }
  return base;
}
