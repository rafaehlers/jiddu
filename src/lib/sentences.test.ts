import assert from "node:assert/strict";
import test from "node:test";
import { splitSentences } from "./sentences";

test("keeps closing quotation marks attached to their sentence", () => {
  const text = "The minister said “This is a claim.” A second sentence follows.";
  const sentences = splitSentences(text);

  assert.deepEqual(
    sentences.map((sentence) => sentence.text),
    [
      "The minister said “This is a claim.”",
      "A second sentence follows.",
    ],
  );
  assert.ok(
    sentences.every(
      (sentence) => text.slice(sentence.start, sentence.end) === sentence.text,
    ),
  );
});
