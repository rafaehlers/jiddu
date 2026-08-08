import OpenAI from "openai";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const REFERER = process.env.OPENROUTER_REFERER || "https://jiddu.app";

let cachedClient: OpenAI | null = null;

export function getSonarClient(apiKey?: string): OpenAI {
  if (!apiKey && cachedClient) return cachedClient;
  const resolvedKey = apiKey ?? process.env.OPENROUTER_API_KEY;
  if (!resolvedKey) {
    throw new Error("OPENROUTER_API_KEY is not set in the environment");
  }
  const client = new OpenAI({
    apiKey: resolvedKey,
    baseURL: OPENROUTER_BASE,
    defaultHeaders: {
      "HTTP-Referer": REFERER,
      "X-Title": "Jiddu",
    },
  });
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
