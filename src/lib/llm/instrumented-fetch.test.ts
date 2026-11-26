import assert from "node:assert/strict";
import test from "node:test";
import {
  createInstrumentedFetch,
  LLM_OPERATION_HEADER,
  type LlmCallRecord,
} from "./instrumented-fetch";

const URL = "https://openrouter.ai/api/v1/chat/completions";
const USAGE = {
  prompt_tokens: 120,
  completion_tokens: 30,
  total_tokens: 150,
  completion_tokens_details: { reasoning_tokens: 10 },
  prompt_tokens_details: { cached_tokens: 20 },
  cost: 0.00042,
};

function harness(respond: (init: RequestInit | undefined) => Promise<Response> | Response) {
  const records: LlmCallRecord[] = [];
  const sent: Headers[] = [];
  let time = 0;
  const wrapped = createInstrumentedFetch(
    (call) => records.push(call),
    async (_input, init) => {
      sent.push(new Headers(init?.headers));
      return respond(init);
    },
    () => (time += 25),
  );
  // Records are written after the body is observed; let microtasks settle.
  const settle = () => new Promise((resolve) => setTimeout(resolve, 20));
  return { records, sent, wrapped, settle };
}

function request(body: Record<string, unknown>, operation?: string): RequestInit {
  return {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-stainless-retry-count": "1",
      ...(operation ? { [LLM_OPERATION_HEADER]: operation } : {}),
    },
    body: JSON.stringify(body),
  };
}

test("records a non-streaming completion and strips the operation header", async () => {
  const { records, sent, wrapped, settle } = harness(() =>
    Response.json({
      id: "gen-1",
      model: "openai/gpt-5.6-luna",
      choices: [{ message: { content: "SECRET_OUTPUT" } }],
      usage: USAGE,
    }),
  );

  const response = await wrapped(
    URL,
    request({ model: "openai/gpt-5.6-luna", messages: [{ role: "user", content: "SECRET_PROMPT" }] }, "slop"),
  );
  assert.equal((await response.json()).id, "gen-1", "caller still reads the body");
  await settle();

  assert.equal(sent[0].get(LLM_OPERATION_HEADER), null);
  assert.equal(records.length, 1);
  const [call] = records;
  assert.equal(call.operation, "slop");
  assert.equal(call.model, "openai/gpt-5.6-luna");
  assert.equal(call.responseModel, "openai/gpt-5.6-luna");
  assert.equal(call.status, "ok");
  assert.equal(call.httpStatus, 200);
  assert.equal(call.stream, false);
  assert.equal(call.retryCount, 1);
  assert.equal(call.promptTokens, 120);
  assert.equal(call.completionTokens, 30);
  assert.equal(call.reasoningTokens, 10);
  assert.equal(call.cachedTokens, 20);
  assert.equal(call.costMicros, 420);
  assert.equal(call.generationId, "gen-1");
  assert.ok(call.durationMs > 0);
  assert.doesNotMatch(JSON.stringify(call), /SECRET_(PROMPT|OUTPUT)/);
});

test("observes a streamed completion without consuming the caller's copy", async () => {
  const chunks = [
    { id: "gen-2", model: "anthropic/claude", choices: [{ delta: { content: "SECRET_" } }] },
    { id: "gen-2", model: "anthropic/claude", choices: [{ delta: { content: "OUTPUT" } }] },
    { id: "gen-2", model: "anthropic/claude", choices: [{ delta: {}, finish_reason: "stop" }], usage: USAGE },
  ];
  const sse = chunks.map((c) => `data: ${JSON.stringify(c)}\n\n`).join("") + "data: [DONE]\n\n";
  const { records, wrapped, settle } = harness(
    () => new Response(sse, { headers: { "content-type": "text/event-stream" } }),
  );

  const response = await wrapped(URL, request({ model: "anthropic/claude", stream: true }, "explain"));
  const text = await response.text();
  assert.match(text, /SECRET_/);
  await settle();

  assert.equal(records.length, 1);
  const [call] = records;
  assert.equal(call.stream, true);
  assert.equal(call.status, "ok");
  assert.equal(call.operation, "explain");
  assert.equal(call.generationId, "gen-2");
  assert.equal(call.totalTokens, 150);
  assert.equal(call.costMicros, 420);
  assert.notEqual(call.firstChunkMs, null);
  assert.doesNotMatch(JSON.stringify(call), /SECRET_|OUTPUT/);
});

test("records provider errors with code and truncated message", async () => {
  const { records, wrapped, settle } = harness(() =>
    Response.json(
      { error: { code: 429, message: `Rate limited ${"x".repeat(400)}` } },
      { status: 429 },
    ),
  );

  const response = await wrapped(URL, request({ model: "m" }, "factcheck_verify"));
  assert.equal(response.status, 429);
  await settle();

  const [call] = records;
  assert.equal(call.status, "error");
  assert.equal(call.httpStatus, 429);
  assert.equal(call.errorCode, "429");
  assert.ok(call.errorMessage!.length <= 201);
});

test("records an in-stream error chunk as a failure", async () => {
  const sse = `data: ${JSON.stringify({ id: "gen-3", choices: [] })}\n\ndata: ${JSON.stringify({ error: { code: "server_error", message: "upstream died" } })}\n\n`;
  const { records, wrapped, settle } = harness(
    () => new Response(sse, { headers: { "content-type": "text/event-stream" } }),
  );

  await (await wrapped(URL, request({ model: "m", stream: true }))).text();
  await settle();

  assert.equal(records[0].status, "error");
  assert.equal(records[0].errorCode, "server_error");
  assert.equal(records[0].operation, "unlabeled");
});

test("records aborted requests and rethrows", async () => {
  const { records, wrapped, settle } = harness(() => {
    throw new DOMException("The operation was aborted.", "AbortError");
  });

  await assert.rejects(wrapped(URL, request({ model: "m" }, "live_context")), {
    name: "AbortError",
  });
  await settle();

  assert.equal(records[0].status, "aborted");
  assert.equal(records[0].errorCode, "AbortError");
});

test("passes other requests through untouched", async () => {
  const { records, sent, wrapped, settle } = harness(() => Response.json({ data: [] }));

  await wrapped("https://openrouter.ai/api/v1/models", { method: "GET" });
  await wrapped("https://openrouter.ai/api/v1/credits", request({ model: "m" }, "x"));
  await settle();

  assert.equal(records.length, 0);
  assert.equal(sent.length, 2);
});

test("keeps working when the recorder throws", async () => {
  const wrapped = createInstrumentedFetch(
    () => {
      throw new Error("db down");
    },
    async () => Response.json({ id: "gen-4", usage: USAGE }),
  );
  const response = await wrapped(URL, request({ model: "m" }, "slop"));
  assert.equal(response.status, 200);
  await new Promise((resolve) => setTimeout(resolve, 20));
});
