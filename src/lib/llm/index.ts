import { OpenRouterProvider, MODEL_CATALOG, resolveModel } from "./openrouter";
import type { LlmProvider } from "./types";
import type { ProviderRoutingPreference } from "@/lib/analysis-models";

export function getProvider(
  modelId?: string | null,
  apiKey?: string,
  providerRoutingByModel?: Record<string, ProviderRoutingPreference>,
): LlmProvider {
  if (!apiKey && !process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set in the environment");
  }
  return new OpenRouterProvider(
    modelId ?? undefined,
    apiKey,
    providerRoutingByModel,
  );
}

export { MODEL_CATALOG, resolveModel };
export type { LlmProvider, ProviderId } from "./types";
