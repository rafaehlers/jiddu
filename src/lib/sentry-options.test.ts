import assert from "node:assert/strict";
import test from "node:test";
import type { ErrorEvent } from "@sentry/nextjs";
import {
  resolveTracesSampleRate,
  scrubSentryBreadcrumb,
  scrubSentryEvent,
  scrubSentrySpan,
  sentryBaseOptions,
  stripQuery,
} from "./sentry-options";

test("stays disabled without a DSN", () => {
  const previous = process.env.NEXT_PUBLIC_SENTRY_DSN;
  delete process.env.NEXT_PUBLIC_SENTRY_DSN;
  try {
    const options = sentryBaseOptions();
    assert.equal(options.enabled, false);
    assert.equal(options.dsn, undefined);
    assert.equal(options.tracesSampleRate, 0.1);
    assert.equal(options.dataCollection.userInfo, false);
    assert.equal(options.dataCollection.cookies, false);
    assert.equal(options.dataCollection.httpHeaders, false);
    assert.deepEqual(options.dataCollection.httpBodies, []);
    assert.equal(options.dataCollection.urlQueryParams, false);
    assert.deepEqual(options.dataCollection.genAI, { inputs: false, outputs: false });
    assert.equal(options.dataCollection.stackFrameVariables, false);
  } finally {
    if (previous !== undefined) process.env.NEXT_PUBLIC_SENTRY_DSN = previous;
  }
});

test("derives the release from the deployed build hash", () => {
  const previous = process.env.NEXT_PUBLIC_JIDDU_BUILD_VERSION;
  process.env.NEXT_PUBLIC_JIDDU_BUILD_VERSION = "2026-11-26 10:00 abc1234";
  try {
    assert.equal(sentryBaseOptions().release, "jiddu@abc1234");
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_JIDDU_BUILD_VERSION;
    else process.env.NEXT_PUBLIC_JIDDU_BUILD_VERSION = previous;
  }
});

test("strips query strings and fragments", () => {
  assert.equal(stripQuery("https://jiddu.app/r/x?text=secret#a"), "https://jiddu.app/r/x");
  assert.equal(stripQuery("/api/analyze"), "/api/analyze");
  assert.equal(stripQuery(undefined), undefined);
});

test("removes request bodies, headers, cookies, user and extra data", () => {
  const event = scrubSentryEvent({
    type: undefined,
    request: {
      method: "POST",
      url: "https://jiddu.app/api/analyze?token=abc",
      data: { text: "submitted article" },
      cookies: { session: "s" },
      headers: { authorization: "Bearer x" },
      query_string: "token=abc",
    },
    user: { id: "user_1", email: "person@example.com", ip_address: "1.2.3.4" },
    extra: { prompt: "full prompt" },
    server_name: "vps-host",
  } as ErrorEvent);

  assert.deepEqual(event.request, {
    method: "POST",
    url: "https://jiddu.app/api/analyze",
  });
  assert.equal(event.user, undefined);
  assert.equal(event.extra, undefined);
  assert.equal(event.server_name, undefined);
});

test("truncates long exception messages and drops frame variables", () => {
  const event = scrubSentryEvent({
    type: undefined,
    exception: {
      values: [
        {
          type: "SyntaxError",
          value: `Unexpected token in JSON: ${"x".repeat(1000)}`,
          stacktrace: { frames: [{ function: "parse", vars: { body: "doc" } }] },
        },
      ],
    },
  } as ErrorEvent);

  const exception = event.exception!.values![0];
  assert.ok(exception.value!.length < 320);
  assert.ok(exception.value!.endsWith("[truncated]"));
  assert.equal(exception.stacktrace!.frames![0].vars, undefined);
});

test("drops console breadcrumbs and strips fetch and navigation URLs", () => {
  assert.equal(
    scrubSentryBreadcrumb({ category: "console", message: "model output" }),
    null,
  );

  assert.deepEqual(
    scrubSentryBreadcrumb({
      category: "fetch",
      data: {
        method: "POST",
        url: "/api/factcheck?q=claim",
        status_code: 500,
        request_body_size: 1234,
      },
    })!.data,
    { method: "POST", url: "/api/factcheck", status_code: 500 },
  );

  assert.deepEqual(
    scrubSentryBreadcrumb({
      category: "navigation",
      data: { from: "/live?x=1", to: "/r/abc#top" },
    })!.data,
    { from: "/live", to: "/r/abc" },
  );
});

test("defaults traces to 10% and accepts valid overrides only", () => {
  assert.equal(resolveTracesSampleRate(undefined), 0.1);
  assert.equal(resolveTracesSampleRate(""), 0.1);
  assert.equal(resolveTracesSampleRate("0"), 0);
  assert.equal(resolveTracesSampleRate("0.25"), 0.25);
  assert.equal(resolveTracesSampleRate("1"), 1);
  assert.equal(resolveTracesSampleRate("2"), 0.1);
  assert.equal(resolveTracesSampleRate("abc"), 0.1);
});

type TestSpan = Parameters<typeof scrubSentrySpan>[0];

function span(name: string, attributes: Record<string, unknown>): TestSpan {
  return {
    trace_id: "t",
    span_id: "s",
    name,
    start_timestamp: 0,
    status: "ok",
    is_segment: false,
    attributes,
  } as TestSpan;
}

test("keeps LLM timing metadata but drops prompts and responses", () => {
  const scrubbed = scrubSentrySpan(
    span("chat openai/gpt-5.6-luna", {
      "gen_ai.request.model": "openai/gpt-5.6-luna",
      "gen_ai.usage.input_tokens": 42,
      "gen_ai.usage.output_tokens": 7,
      "gen_ai.response.time_to_first_chunk": 0.3,
      "gen_ai.input.messages": "[{\"role\":\"user\",\"content\":\"article\"}]",
      "gen_ai.output.messages": "model answer",
      "gen_ai.request.messages": "legacy prompt",
      "gen_ai.response.text": "legacy answer",
      "gen_ai.system_instructions": "system prompt",
    }),
  );

  assert.deepEqual(scrubbed.attributes, {
    "gen_ai.request.model": "openai/gpt-5.6-luna",
    "gen_ai.usage.input_tokens": 42,
    "gen_ai.usage.output_tokens": 7,
    "gen_ai.response.time_to_first_chunk": 0.3,
  });
});

test("strips query strings from span names and URL attributes", () => {
  const scrubbed = scrubSentrySpan(
    span("GET /api/slop?text=secret", {
      "url.full": "https://jiddu.app/api/slop?text=secret#x",
      "http.target": "/api/slop?text=secret",
      "url.path": "/api/slop",
      "http.route": { value: "/r/abc?ref=mail", type: "string" },
      "url.query": "text=secret",
      "http.request.header.cookie": "session=1",
      "user.email": "person@example.com",
      "db.query.text": "select * from x where y = 'secret'",
      "gen_ai.request.model": "model?not-a-url",
    }),
  );

  assert.equal(scrubbed.name, "GET /api/slop");
  assert.deepEqual(scrubbed.attributes, {
    "url.full": "https://jiddu.app/api/slop",
    "http.target": "/api/slop",
    "url.path": "/api/slop",
    "http.route": { value: "/r/abc", type: "string" },
    "gen_ai.request.model": "model?not-a-url",
  });
});
