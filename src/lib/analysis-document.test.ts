import assert from "node:assert/strict";
import test from "node:test";
import {
  prepareAnalysisDocument,
  readAnalysisBlocks,
} from "./analysis-document";

const structuredText = `Introduction

The paper presents a testable claim. It states the scope clearly.

Methods

We compare two controlled conditions. Every run uses a language model.

References

Smith, A. (2024). Example reference.`;

test("prepares sectioned content while keeping references out of model sentences", () => {
  const prepared = prepareAnalysisDocument(
    {
      title: "Example paper",
      text: structuredText,
      source: "pdf",
      sourceRef: "example.pdf",
    },
    10_000,
  );

  assert.deepEqual(
    prepared.blocks.map((block) => [block.section, block.kind]),
    [
      ["Introduction", "content"],
      ["Methods", "content"],
      ["References", "references"],
    ],
  );
  assert.equal(prepared.sentences.length, 4);
  assert.ok(prepared.text.includes("Smith, A. (2024). Example reference."));
  assert.ok(
    prepared.sentences.every(
      (sentence) =>
        prepared.text.slice(sentence.start, sentence.end) === sentence.text,
    ),
  );
  assert.ok(
    prepared.sentences.every(
      (sentence) => !sentence.text.includes("Example reference"),
    ),
  );
});

test("recovers conservative headings for analyses created before blocks existed", () => {
  const blocks = readAnalysisBlocks("[]", structuredText);

  assert.equal(blocks.length, 3);
  assert.equal(blocks[0].section, "Introduction");
  assert.equal(blocks[1].section, "Methods");
  assert.equal(blocks[2].kind, "references");
});

test("ignores malformed persisted structure and falls back safely", () => {
  const blocks = readAnalysisBlocks('[{"id":4,"text":null}]', structuredText);

  assert.equal(blocks.length, 3);
  assert.equal(blocks[0].section, "Introduction");
});
