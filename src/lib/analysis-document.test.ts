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

test("carries URL article structure and quotation context into model sentences", () => {
  const prepared = prepareAnalysisDocument(
    {
      title: "Diplomatic report",
      text: "Opening context.\n\nThe minister said “This is a quoted claim.”\n\nA full quoted response.",
      source: "url",
      sourceRef: "https://example.com/report",
      editorial: {
        metadata: {
          title: "Diplomatic report",
          siteName: "Example News",
          author: "Reporter Name",
        },
        blocks: [
          { kind: "heading", text: "Diplomacy", level: 2 },
          {
            kind: "paragraph",
            text: "Opening context.",
            section: "Diplomacy",
            sectionLevel: 2,
          },
          {
            kind: "paragraph",
            text: "The minister said “This is a quoted claim.”",
            section: "Diplomacy",
            sectionLevel: 2,
          },
          {
            kind: "quote",
            text: "A full quoted response.",
            section: "Diplomacy",
            sectionLevel: 2,
            quoteAttribution: "The minister",
          },
        ],
      },
    },
    10_000,
  );

  assert.equal(prepared.blocks.length, 3);
  assert.equal(prepared.blocks[0].section, "Diplomacy");
  assert.equal(prepared.blocks[0].documentMetadata?.author, "Reporter Name");
  assert.equal(prepared.sentences[0].containsQuotation, undefined);
  assert.equal(prepared.sentences[1].containsQuotation, true);
  assert.equal(prepared.sentences[2].editorialKind, "quote");
  assert.equal(prepared.sentences[2].quoteAttribution, "The minister");
  assert.ok(
    prepared.sentences.every(
      (sentence) =>
        prepared.text.slice(sentence.start, sentence.end) === sentence.text,
    ),
  );
});
