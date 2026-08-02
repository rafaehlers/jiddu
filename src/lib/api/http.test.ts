import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_FACT_CHECK_TEXT_CHARS,
  readText,
} from "@/lib/api/http";

test("accepts the optimized fact-check input size without raising every API limit", () => {
  const text = "A factual sentence with enough context to inspect. ".repeat(100);
  assert.ok(text.length > 2_000);
  assert.equal(readText({ text }, MAX_FACT_CHECK_TEXT_CHARS), text);

  const defaultResult = readText({ text });
  assert.ok(defaultResult instanceof Response);
  assert.equal(defaultResult.status, 400);
});

test("rejects visually empty API text before reserving analysis credits", () => {
  const result = readText({ text: " ".repeat(80) });
  assert.ok(result instanceof Response);
  assert.equal(result.status, 422);
});
