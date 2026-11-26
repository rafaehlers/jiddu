// A `fetch` for the OpenAI SDK that measures every OpenRouter chat completion
// without touching its content. Each attempt (including SDK retries) produces
// one LlmCallRecord: operation, model, status, latency, time to first chunk,
// token usage and cost. Prompts, model output and user identity are never
// read into the record.
//
// The response is handed back to the SDK untouched: non-streaming bodies are
// cloned, streaming bodies are teed, and parsing happens off the hot path.

import { readOpenRouterUsage } from "../openrouter-usage";

export const LLM_OPERATION_HEADER = "x-jiddu-llm-operation";
const RETRY_COUNT_HEADER = "x-stainless-retry-count";
const MAX_ERROR_MESSAGE_LENGTH = 200;

export type LlmCallStatus = "ok" | "error" | "aborted";

export type LlmCallRecord = {
  startedAt: Date;
  operation: string;
  model: string;
  responseModel: string | null;
  stream: boolean;
  status: LlmCallStatus;
  httpStatus: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  retryCount: number;
  durationMs: number;
  ttfbMs: number | null;
  firstChunkMs: number | null;
  promptTokens: number;
  completionTokens: number;
  reasoningTokens: number;
  cachedTokens: number;
  totalTokens: number;
  costMicros: number | null;
  generationId: string | null;
};

type Fetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

type Clock = () => number;

type CallContext = {
  startedAt: Date;
  start: number;
  operation: string;
  model: string;
  stream: boolean;
  retryCount: number;
};

export function createInstrumentedFetch(
  record: (call: LlmCallRecord) => void,
  baseFetch: Fetch = (input, init) => fetch(input, init),
  clock: Clock = () => performance.now(),
): Fetch {
  return async (input, init) => {
    if (!isChatCompletion(input, init)) return baseFetch(input, init);

    const headers = new Headers(init?.headers);
    const operation = headers.get(LLM_OPERATION_HEADER)?.trim() || "unlabeled";
    headers.delete(LLM_OPERATION_HEADER);
    const body = typeof init?.body === "string" ? init.body : "";

    const ctx: CallContext = {
      startedAt: new Date(),
      start: clock(),
      operation,
      model: /"model"\s*:\s*"([^"]+)"/.exec(body)?.[1] ?? "unknown",
      stream: /"stream"\s*:\s*true/.test(body),
      retryCount: Number(headers.get(RETRY_COUNT_HEADER)) || 0,
    };
    const emit = (partial: Partial<LlmCallRecord>) =>
      safeRecord(record, buildRecord(ctx, clock(), partial));

    let response: Response;
    try {
      response = await baseFetch(input, { ...init, headers });
    } catch (error) {
      emit({
        status: isAbort(error) ? "aborted" : "error",
        errorCode: errorName(error),
        errorMessage: errorText(error),
      });
      throw error;
    }

    const ttfbMs = elapsed(ctx.start, clock());

    if (!response.ok) {
      void response
        .clone()
        .text()
        .then((text) => {
          const error = readErrorBody(text);
          emit({
            status: "error",
            httpStatus: response.status,
            ttfbMs,
            errorCode: error.code ?? `http_${response.status}`,
            errorMessage: error.message,
          });
        })
        .catch(() =>
          emit({ status: "error", httpStatus: response.status, ttfbMs }),
        );
      return response;
    }

    const isEventStream = (response.headers.get("content-type") ?? "").includes(
      "text/event-stream",
    );

    if (isEventStream && response.body) {
      const [forCaller, forObserver] = response.body.tee();
      void observeStream(forObserver, ctx, clock).then((partial) =>
        emit({ httpStatus: response.status, ttfbMs, ...partial }),
      );
      return new Response(forCaller, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

    void response
      .clone()
      .json()
      .then((json: unknown) =>
        emit({
          httpStatus: response.status,
          ttfbMs,
          ...completionFields(json, ctx.model),
        }),
      )
      .catch((error: unknown) =>
        emit({
          status: isAbort(error) ? "aborted" : "ok",
          httpStatus: response.status,
          ttfbMs,
        }),
      );
    return response;
  };
}

function isChatCompletion(
  input: string | URL | Request,
  init: RequestInit | undefined,
): boolean {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  const method = (
    init?.method ?? (input instanceof Request ? input.method : "GET")
  ).toUpperCase();
  return method === "POST" && /\/chat\/completions(?:[?#]|$)/.test(url);
}

async function observeStream(
  stream: ReadableStream<Uint8Array>,
  ctx: CallContext,
  clock: Clock,
): Promise<Partial<LlmCallRecord>> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let firstChunkMs: number | null = null;
  let last: Partial<LlmCallRecord> = {};
  let streamError: { code: string | null; message: string | null } | null = null;

  const handleLine = (line: string) => {
    if (!line.startsWith("data:")) return;
    const data = line.slice(5).trim();
    if (!data || data === "[DONE]") return;
    if (firstChunkMs === null) firstChunkMs = elapsed(ctx.start, clock());
    // Only chunks that can carry usage, ids or errors are worth parsing.
    if (!/"(usage|error)"/.test(data) && last.generationId) return;
    let chunk: unknown;
    try {
      chunk = JSON.parse(data);
    } catch {
      return;
    }
    const root = chunk as Record<string, unknown>;
    if (root.error) {
      streamError = readErrorObject(root.error);
      return;
    }
    const fields = completionFields(chunk, ctx.model);
    last = {
      ...last,
      generationId: fields.generationId ?? last.generationId ?? null,
      responseModel: fields.responseModel ?? last.responseModel ?? null,
      ...(root.usage ? fields : {}),
    };
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline: number;
      while ((newline = buffer.indexOf("\n")) !== -1) {
        handleLine(buffer.slice(0, newline).trim());
        buffer = buffer.slice(newline + 1);
      }
    }
    handleLine(buffer.trim());
  } catch (error) {
    return {
      ...last,
      firstChunkMs,
      status: isAbort(error) ? "aborted" : "error",
      errorCode: errorName(error),
      errorMessage: errorText(error),
    };
  }

  const failed = streamError as { code: string | null; message: string | null } | null;
  return {
    ...last,
    firstChunkMs,
    status: failed ? "error" : "ok",
    ...(failed
      ? { errorCode: failed.code ?? "stream_error", errorMessage: failed.message }
      : {}),
  };
}

function completionFields(json: unknown, model: string): Partial<LlmCallRecord> {
  const root =
    json !== null && typeof json === "object"
      ? (json as Record<string, unknown>)
      : {};
  const usage = readOpenRouterUsage(json, model);
  return {
    generationId: typeof root.id === "string" ? root.id : null,
    responseModel: typeof root.model === "string" ? root.model : null,
    ...(usage
      ? {
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          reasoningTokens: usage.reasoningTokens,
          cachedTokens: usage.cachedTokens,
          totalTokens: usage.totalTokens,
          costMicros:
            usage.costUsd === null ? null : Math.round(usage.costUsd * 1_000_000),
        }
      : {}),
  };
}

function buildRecord(
  ctx: CallContext,
  now: number,
  partial: Partial<LlmCallRecord>,
): LlmCallRecord {
  return {
    startedAt: ctx.startedAt,
    operation: ctx.operation,
    model: ctx.model,
    stream: ctx.stream,
    retryCount: ctx.retryCount,
    responseModel: null,
    status: "ok",
    httpStatus: null,
    errorCode: null,
    errorMessage: null,
    ttfbMs: null,
    firstChunkMs: null,
    promptTokens: 0,
    completionTokens: 0,
    reasoningTokens: 0,
    cachedTokens: 0,
    totalTokens: 0,
    costMicros: null,
    generationId: null,
    ...partial,
    durationMs: elapsed(ctx.start, now),
  };
}

function safeRecord(record: (call: LlmCallRecord) => void, call: LlmCallRecord) {
  try {
    record(call);
  } catch (error) {
    console.warn(
      "[llm-call-log] record failed",
      error instanceof Error ? error.message : error,
    );
  }
}

function readErrorBody(text: string): { code: string | null; message: string | null } {
  try {
    const parsed = JSON.parse(text) as { error?: unknown };
    if (parsed && typeof parsed === "object" && parsed.error) {
      return readErrorObject(parsed.error);
    }
  } catch {
    // Not JSON: fall through to a status-only record.
  }
  return { code: null, message: null };
}

function readErrorObject(error: unknown): { code: string | null; message: string | null } {
  if (typeof error === "string") return { code: null, message: truncate(error) };
  if (!error || typeof error !== "object") return { code: null, message: null };
  const record = error as { code?: unknown; message?: unknown };
  return {
    code:
      typeof record.code === "string" || typeof record.code === "number"
        ? String(record.code)
        : null,
    message: typeof record.message === "string" ? truncate(record.message) : null,
  };
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
}

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : "unknown_error";
}

function errorText(error: unknown): string | null {
  return error instanceof Error ? truncate(error.message) : null;
}

function truncate(value: string): string {
  return value.length <= MAX_ERROR_MESSAGE_LENGTH
    ? value
    : `${value.slice(0, MAX_ERROR_MESSAGE_LENGTH)}…`;
}

function elapsed(start: number, end: number): number {
  return Math.max(0, Math.round(end - start));
}
