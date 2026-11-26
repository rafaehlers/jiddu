import assert from "node:assert/strict";
import test from "node:test";
import type { ErrorEvent } from "@sentry/nextjs";
import {
  scrubSentryBreadcrumb,
  scrubSentryEvent,
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
    assert.equal(options.tracesSampleRate, 0);
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
