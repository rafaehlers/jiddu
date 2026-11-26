import type OpenAI from "openai";
import { createOpenRouterClient } from "./openrouter-client";

let cachedClient: OpenAI | null = null;

export function getSonarClient(apiKey?: string): OpenAI {
  if (!apiKey && cachedClient) return cachedClient;
  const resolvedKey = apiKey ?? process.env.OPENROUTER_API_KEY;
  if (!resolvedKey) {
    throw new Error("OPENROUTER_API_KEY is not set in the environment");
  }
  const client = createOpenRouterClient(resolvedKey);
  if (!apiKey) cachedClient = client;
  return client;
}

export type SonarMessage = {
  content?: string | null;
  annotations?: Array<{
    type?: string;
    url_citation?: { url?: string; title?: string };
  }>;
};
