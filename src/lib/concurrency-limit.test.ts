import assert from "node:assert/strict";
import { test } from "node:test";
import { acquireConcurrency } from "./concurrency-limit";

test("acquireConcurrency holds, releases, and reacquires a permit", () => {
  const key = `test:${crypto.randomUUID()}`;
  const first = acquireConcurrency(key, 1);

  assert.ok(first);
  assert.equal(acquireConcurrency(key, 1), null);

  first.release();
  first.release();

  const next = acquireConcurrency(key, 1);
  assert.ok(next);
  next.release();
});
