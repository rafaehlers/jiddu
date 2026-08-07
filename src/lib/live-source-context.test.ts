import assert from "node:assert/strict";
import test from "node:test";
import {
  capturedSourceHost,
  normalizeCapturedSourceUrl,
} from "./live-source-context";

test("normalizes a captured tab URL without its fragment", () => {
  assert.equal(
    normalizeCapturedSourceUrl(
      " https://www.bloomberg.com/news/videos/2026-08-05/ai-frenzy#player ",
    ),
    "https://www.bloomberg.com/news/videos/2026-08-05/ai-frenzy",
  );
  assert.equal(capturedSourceHost("https://www.bloomberg.com/story"), "bloomberg.com");
});

test("rejects unsafe, credentialed and malformed captured source URLs", () => {
  assert.equal(normalizeCapturedSourceUrl("javascript:alert(1)"), null);
  assert.equal(normalizeCapturedSourceUrl("https://user:secret@example.com"), null);
  assert.equal(normalizeCapturedSourceUrl("not a URL"), null);
});
