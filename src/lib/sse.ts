export type SseEvent = { event: string; data: string };

const DEFAULT_PREMATURE_END_MESSAGE =
  "The connection ended before the analysis completed. Please try again.";

export function prematureSseEndMessage(lang?: string): string {
  if (lang === "pt") {
    return "A conexão terminou antes de a análise ser concluída. Tente novamente.";
  }
  if (lang === "es") {
    return "La conexión terminó antes de que se completara el análisis. Inténtalo de nuevo.";
  }
  return DEFAULT_PREMATURE_END_MESSAGE;
}

export async function* readSse(
  response: Response,
  signal?: AbortSignal,
  prematureEndMessage = DEFAULT_PREMATURE_END_MESSAGE,
): AsyncGenerator<SseEvent> {
  if (!response.body) throw new Error("Response has no body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let terminalEventReceived = false;

  try {
    while (true) {
      if (signal?.aborted) {
        await reader.cancel();
        return;
      }
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const raw = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const lines = raw.split("\n");
        let eventName = "message";
        const dataLines: string[] = [];
        for (const line of lines) {
          if (line.startsWith("event:")) eventName = line.slice(6).trim();
          else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
        }
        if (dataLines.length === 0) continue;
        if (eventName === "done" || eventName === "error") {
          terminalEventReceived = true;
        }
        yield { event: eventName, data: dataLines.join("\n") };
      }
    }
  } catch {
    if (signal?.aborted) return;
  } finally {
    reader.releaseLock();
  }

  if (!terminalEventReceived && !signal?.aborted) {
    yield {
      event: "error",
      data: JSON.stringify({
        error: prematureEndMessage,
        code: "stream_ended_early",
      }),
    };
  }
}
