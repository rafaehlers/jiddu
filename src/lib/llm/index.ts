import { AnthropicProvider } from "./anthropic";
import { OpenAIProvider } from "./openai";
import type { LlmProvider, ProviderId } from "./types";

export function getProvider(id?: ProviderId | string): LlmProvider {
  const requested = (id ?? process.env.LLM_PROVIDER ?? "anthropic").toLowerCase();
  switch (requested) {
    case "openai":
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not set in the environment");
      }
      return new OpenAIProvider();
    case "anthropic":
    default:
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("ANTHROPIC_API_KEY is not set in the environment");
      }
      return new AnthropicProvider();
  }
}

export type { LlmProvider, ProviderId } from "./types";
