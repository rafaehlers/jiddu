import assert from "node:assert/strict";
import test from "node:test";
import { prematureSseEndMessage, readSse } from "./sse";

function sseResponse(parts: string[]): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const part of parts) controller.enqueue(encoder.encode(part));
        controller.close();
      },
    }),
  );
}

test("ignores heartbeat comments and preserves regular SSE events", async () => {
  const events = [];
  for await (const event of readSse(
    sseResponse([
      ": heartbeat\n\n",
      'event: meta\ndata: {"id":"abc"}\n\n',
      'event: done\ndata: {"id":"abc"}\n\n',
    ]),
  )) {
    events.push(event);
  }

  assert.deepEqual(events, [
    { event: "meta", data: '{"id":"abc"}' },
    { event: "done", data: '{"id":"abc"}' },
  ]);
});

test("turns a premature EOF into an actionable error event", async () => {
  const events = [];
  for await (const event of readSse(
    sseResponse(['event: meta\ndata: {"id":"abc"}\n\n']),
    undefined,
    "A conexão terminou antes da conclusão.",
  )) {
    events.push(event);
  }

  assert.equal(events.length, 2);
  assert.deepEqual(events[0], { event: "meta", data: '{"id":"abc"}' });
  assert.deepEqual(JSON.parse(events[1]!.data), {
    error: "A conexão terminou antes da conclusão.",
    code: "stream_ended_early",
  });
});

test("localizes the premature stream error", () => {
  assert.equal(
    prematureSseEndMessage("pt"),
    "A conexão terminou antes de a análise ser concluída. Tente novamente.",
  );
  assert.equal(
    prematureSseEndMessage("es"),
    "La conexión terminó antes de que se completara el análisis. Inténtalo de nuevo.",
  );
  assert.match(prematureSseEndMessage("en"), /connection ended/i);
});
