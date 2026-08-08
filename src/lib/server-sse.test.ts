import assert from "node:assert/strict";
import test from "node:test";
import { createServerSseWriter } from "./server-sse";

test("writes SSE events and invisible heartbeat comments", () => {
  const chunks: string[] = [];
  let closed = false;
  const decoder = new TextDecoder();
  const writer = createServerSseWriter(
    {
      enqueue(chunk) {
        chunks.push(decoder.decode(chunk));
      },
      close() {
        closed = true;
      },
    },
    { heartbeatMs: 0 },
  );

  assert.equal(writer.send("meta", { id: "abc" }), true);
  assert.equal(writer.heartbeat(), true);
  writer.close();

  assert.deepEqual(chunks, [
    'event: meta\ndata: {"id":"abc"}\n\n',
    ": heartbeat\n\n",
  ]);
  assert.equal(closed, true);
  assert.equal(writer.send("done", {}), false);
});

test("cancel stops future writes without closing an already-cancelled stream", () => {
  const chunks: Uint8Array[] = [];
  let closeCount = 0;
  const writer = createServerSseWriter(
    {
      enqueue(chunk) {
        if (chunk) chunks.push(chunk);
      },
      close() {
        closeCount += 1;
      },
    },
    { heartbeatMs: 0 },
  );

  writer.cancel();

  assert.equal(writer.heartbeat(), false);
  assert.equal(writer.send("done", {}), false);
  writer.close();
  assert.equal(chunks.length, 0);
  assert.equal(closeCount, 0);
});
