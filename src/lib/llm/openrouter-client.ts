// The single place that builds OpenAI SDK clients for OpenRouter. Every client
// shares the instrumented fetch, so each chat completion lands in the LlmCall
// table with its operation, model, latency, tokens and cost.

import OpenAI from "openai";
import {
  createInstrumentedFetch,
  LLM_OPERATION_HEADER,
} from "./instrumented-fetch";
import { recordLlmCall } from "./llm-call-log";

// Override only for local testing against an OpenRouter-compatible mock.
export const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL?.trim() || "https://openrouter.ai/api/v1";
const REFERER = process.env.OPENROUTER_REFERER || "https://jiddu.app";

const instrumentedFetch = createInstrumentedFetch(recordLlmCall);

export function createOpenRouterClient(apiKey: string | undefined): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: {
      "HTTP-Referer": REFERER,
      "X-Title": "Jiddu",
    },
    fetch: instrumentedFetch,
  });
}

// Per-request options naming the Jiddu operation behind a call (for example
// "slop" or "factcheck_verify"). The label travels as a request header that the
// instrumented fetch reads and strips before the request leaves the server.
type RequestOptions = NonNullable<
  Parameters<OpenAI["chat"]["completions"]["create"]>[1]
>;

export function llmRequestOptions(
  operation: string,
  signal?: AbortSignal,
): RequestOptions {
  return {
    headers: { [LLM_OPERATION_HEADER]: operation },
    ...(signal ? { signal } : {}),
  };
}
