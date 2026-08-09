import assert from "node:assert/strict";
import test from "node:test";
import {
  buildExplainInputSections,
  buildParagraphExplainInputSections,
  capExplainBlocks,
  chunkExplainSections,
  normalizeFindingsForSections,
} from "./explain-units";
import type { Block } from "./paragraphs";
import { buildExplainSystemPrompt, buildExplainUserPrompt } from "./explain-prompt";

const blocks: Block[] = [
  { id: "p0", start: 0, end: 10, text: "First paragraph.", section: "Introduction", sectionId: "s0" },
  { id: "p1", start: 11, end: 20, text: "Second paragraph.", section: "Introduction", sectionId: "s0" },
  { id: "p2", start: 21, end: 30, text: "Method paragraph.", section: "Methods", sectionId: "s1" },
];

test("keeps paragraphs together as one analysis section", () => {
  const sections = buildExplainInputSections(blocks);
  assert.equal(sections.length, 2);
  assert.deepEqual(sections[0].blocks.map((block) => block.id), ["p0", "p1"]);

  const chunks = chunkExplainSections(sections, { target: 20, minToSplit: 1 });
  assert.equal(chunks.length, 2);
  assert.deepEqual(chunks[0].sections.map((section) => section.id), ["s0"]);
});

test("normalizes a model finding to every paragraph in its section", () => {
  const sections = buildExplainInputSections(blocks);
  const findings = normalizeFindingsForSections(
    [
      { blockIds: ["p0"], role: "background", explanation: "Intro explained." },
      { blockIds: ["p1"], role: "background", explanation: "Duplicate." },
      { blockIds: ["p2"], role: "method", explanation: "Method explained." },
    ],
    sections,
  );
  assert.equal(findings.length, 2);
  assert.deepEqual(findings[0].blockIds, ["p0", "p1"]);
  assert.deepEqual(findings[1].blockIds, ["p2"]);
});

test("prompts for one finding per section with every paragraph id", () => {
  const sections = buildExplainInputSections(blocks);
  const system = buildExplainSystemPrompt("pt", "high_school");
  const user = buildExplainUserPrompt(sections, "pt");
  assert.match(system, /EXACTLY ONE entry per <section>/);
  assert.match(system, /One section in means one finding out/);
  assert.match(user, /block_ids="p0,p1"/);
  assert.equal((user.match(/<section /g) ?? []).length, 2);
  assert.match(user, /path="Introduction"/);
  assert.match(system, /12 to 20 words per sentence/);
  assert.match(system, /Do not exceed 25 words/);
  assert.match(system, /3 to 5 sentences explaining the COMPLETE section/);
  assert.match(system, /Use one consistent term for one concept/);
});

test("gives undergraduate explanations more assumed knowledge and depth", () => {
  const highSchool = buildExplainSystemPrompt("pt", "high_school");
  const undergrad = buildExplainSystemPrompt("pt", "undergrad");

  assert.notEqual(highSchool, undergrad);
  assert.match(highSchool, /without specialist training/);
  assert.match(highSchool, /define each field-specific term/);
  assert.match(undergrad, /introductory research methods/);
  assert.match(undergrad, /what follows from that choice/);
  assert.match(undergrad, /3 to 6 sentences explaining the COMPLETE section/);
});

test("keeps the public API at one semantic unit per paragraph", () => {
  const sections = buildParagraphExplainInputSections(blocks);
  assert.equal(sections.length, blocks.length);
  assert.ok(sections.every((section) => section.blocks.length === 1));
});

test("caps structured blocks without crossing the persisted text ceiling", () => {
  const capped = capExplainBlocks(blocks, 35);
  assert.deepEqual(capped.map((block) => block.id), ["p0", "p1"]);
  assert.ok(capped.map((block) => block.text).join("\n\n").length <= 35);
});
