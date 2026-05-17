import { OpenRouterProvider, MODEL_CATALOG, resolveModel } from "./openrouter";
import type { LlmProvider } from "./types";

export function getProvider(modelId?: string | null): LlmProvider {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set in the environment");
  }
  return new OpenRouterProvider(modelId ?? undefined);
}

export { MODEL_CATALOG, resolveModel };
export type { LlmProvider, ProviderId } from "./types";
