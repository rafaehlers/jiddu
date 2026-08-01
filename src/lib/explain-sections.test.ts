import assert from "node:assert/strict";
import test from "node:test";
import {
  getExplainableBlocks,
  getExplainableFindings,
  groupExplainSections,
} from "./explain-sections";
import { splitBlocks } from "./paragraphs";

test("marks a references section and excludes it from explanation", () => {
  const blocks = splitBlocks(`1 Introduction
The paper introduces its research question.

2 Results
The experiment improved accuracy.

References
Smith, J. (2024). A cited paper.
Doe, A. (2023). Another cited paper.`);

  const references = blocks.filter((block) => block.kind === "references");
  assert.equal(references.length, 1);
  assert.match(references[0].text, /Smith/);
  assert.equal(getExplainableBlocks(blocks).length, 2);
});

test("keeps the references classification even with a single detected heading", () => {
  const blocks = splitBlocks(`Opening prose without a heading.

References
Smith, J. (2024). A cited paper.`);

  assert.equal(blocks.at(-1)?.section, null);
  assert.equal(blocks.at(-1)?.kind, "references");
  assert.equal(getExplainableBlocks(blocks).length, 1);
});

test("recognizes Markdown headings from academic PDF extraction", () => {
  const blocks = splitBlocks(`# Introduction

Opening context.

## Methods

Study procedure.

# References

Smith, J. (2024). A cited paper.`);

  assert.deepEqual(
    blocks.map((block) => [block.section, block.kind]),
    [
      ["Introduction", "content"],
      ["Methods", "content"],
      ["References", "references"],
    ],
  );
});

test("groups contiguous sections and removes findings anchored to references", () => {
  const blocks = splitBlocks(`1 Introduction
Opening context.

2 Method
Study procedure.

References
Smith, J. (2024). A cited paper.`);
  const sections = groupExplainSections(blocks);
  const findings = getExplainableFindings(
    blocks.map((block) => ({
      blockIds: [block.id],
      role: "background" as const,
      explanation: block.text,
    })),
    blocks,
  );

  assert.deepEqual(
    sections.map((section) => [section.title, section.isReferences]),
    [
      ["1 Introduction", false],
      ["2 Method", false],
      ["References", true],
    ],
  );
  assert.equal(findings.length, 2);
});
