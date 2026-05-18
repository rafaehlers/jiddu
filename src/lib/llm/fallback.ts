// Cross-model fallback for streaming LLM calls.
//
// OpenRouter has a native `models: [...]` array that retries across models on
// failure, but its `provider: {...}` block is shared by all models in the
// request — and we need per-model provider preferences (MiniMax must be
// pinned to the "Minimax" upstream, otherwise Morph/Fireworks burn the
// budget on reasoning and never emit the tool_call). So we do the fallback
// client-side: try the first model; if it fails before yielding anything,
// try the next one with its own provider preferences.
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
      while (true) {
        result = await gen.next();
        if (result.done) return result.value;
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

// The default chain used everywhere when the caller doesn't pick a model
// explicitly. Order is: cheapest/fastest first, robust fallback second.
export const DEFAULT_MODEL_CHAIN: readonly string[] = [
  "gpt-5.4-mini",
  "minimax-m2.7",
];
