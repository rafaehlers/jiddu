// Cross-model fallback for streaming LLM calls.
//
// OpenRouter has a native `models: [...]` array that retries across models on
// failure, but its `provider: {...}` and reasoning controls are shared by all
// models in the request. We do the fallback client-side so each model gets its
// own routing and reasoning configuration.
//
// Once any event has been yielded we do NOT retry — we accept the partial
// output and let the caller's partial-parse / salvage logic kick in.

export type StreamFactory<E, R> = (
  model: string,
) => AsyncGenerator<E, R, void>;

export async function* withModelFallback<E, R>(
  models: string[],
  makeStream: StreamFactory<E, R>,
  signal?: AbortSignal,
  onModelUsed?: (model: string) => void,
): AsyncGenerator<E, R, void> {
  if (models.length === 0) {
    throw new Error("withModelFallback: empty model list");
  }
  let lastError: unknown;
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    if (signal?.aborted) throw new Error("aborted");
    let emitted = false;
    try {
      const gen = makeStream(model);
      let result: IteratorResult<E, R>;
      let usageRecorded = false;
      while (true) {
        result = await gen.next();
        if (result.done) {
          if (!usageRecorded) onModelUsed?.(model);
          return result.value;
        }
        if (!usageRecorded) {
          onModelUsed?.(model);
          usageRecorded = true;
        }
        emitted = true;
        yield result.value;
      }
    } catch (err) {
      lastError = err;
      if (emitted || i === models.length - 1) throw err;
      console.warn(
        `[withModelFallback] model="${model}" failed before yielding anything, falling back: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
  throw lastError;
}

// Non-streaming companion used by small final synthesis calls. As with the
// streaming helper, each retry gets its own model-specific provider routing.
export async function withModelFallbackPromise<T>(
  models: string[],
  makeRequest: (model: string) => Promise<T>,
  signal?: AbortSignal,
  onModelUsed?: (model: string) => void,
): Promise<T> {
  if (models.length === 0) {
    throw new Error("withModelFallbackPromise: empty model list");
  }
  let lastError: unknown;
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    if (signal?.aborted) throw new Error("aborted");
    try {
      const result = await makeRequest(model);
      onModelUsed?.(model);
      return result;
    } catch (err) {
      lastError = err;
      if (i === models.length - 1) throw err;
      console.warn(
        `[withModelFallbackPromise] model="${model}" failed, falling back: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
  throw lastError;
}

// The default chain used everywhere when the caller doesn't pick a model
// explicitly. Order is: primary default first, economical cross-family
// fallback second.
export const DEFAULT_MODEL_CHAIN: readonly string[] = [
  "gpt-5.6-luna",
  "deepseek-v4-flash-0731",
];
