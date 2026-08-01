import assert from "node:assert/strict";
import test from "node:test";
import {
  PaperMapSchema,
  parsePaperMap,
  sanitizePaperSynthesis,
  type ExplainFinding,
} from "./explain-schema";
import {
  buildPaperMapUserPrompt,
  selectPaperMapEvidence,
} from "./paper-map-prompt";
import type { Block } from "./paragraphs";

function statement(text: string, blockIds: string[]) {
  return { text, blockIds };
}

test("parses persisted maps defensively for legacy and malformed rows", () => {
  const map = {
    paperTypes: ["Empirical"],
    contributionTypes: ["Replication"],
    researchQuestion: statement("Does it replicate?", ["p1"]),
    contribution: null,
    approach: null,
    mainAnswer: null,
    evidence: null,
    statedLimitation: null,
  };

  assert.deepEqual(parsePaperMap(JSON.stringify(map)), PaperMapSchema.parse(map));
  assert.equal(parsePaperMap(null), null);
  assert.equal(parsePaperMap("not-json"), null);
  assert.equal(parsePaperMap(JSON.stringify({ paperTypes: [] })), null);
});

test("sanitizes tags, empty statements and invented block references", () => {
  const synthesis = sanitizePaperSynthesis(
    {
      overview: "  Whole paper.  ",
      paperMap: {
        paperTypes: [" Empirical ", "Empirical", "Methodological", "Extra"],
        contributionTypes: [" New method "],
        researchQuestion: statement("  What changes?  ", ["p1", "fake", "p1"]),
        contribution: statement("   ", ["p2"]),
        approach: null,
        mainAnswer: null,
        evidence: null,
        statedLimitation: null,
      },
    },
    new Set(["p1", "p2"]),
  );

  assert.equal(synthesis.overview, "Whole paper.");
  assert.deepEqual(synthesis.paperMap.paperTypes, [
    "Empirical",
    "Methodological",
    "Extra",
  ]);
  assert.deepEqual(synthesis.paperMap.researchQuestion, {
    text: "What changes?",
    blockIds: ["p1"],
  });
  assert.equal(synthesis.paperMap.contribution, null);
});

test("paper-map evidence spans the document and retains semantic roles", () => {
  const blocks: Block[] = Array.from({ length: 30 }, (_, index) => ({
    id: `p${index}`,
    start: index * 10,
    end: index * 10 + 9,
    text: `Paragraph ${index} source evidence`,
    section: index < 10 ? "Introduction" : index < 25 ? "Results" : "Conclusion",
  }));
  const findings: ExplainFinding[] = blocks.map((block, index) => ({
    blockIds: [block.id],
    role:
      index === 12
        ? "objective"
        : index === 17
          ? "limitation"
          : index >= 5 && index <= 24
            ? "result"
            : "background",
    explanation: `Explanation ${index}`,
  }));

  const evidence = selectPaperMapEvidence(blocks, findings);
  assert.match(evidence, /\[p0\]/);
  assert.match(evidence, /\[p29\]/);
  assert.match(evidence, /\[p12\].*role=objective/);
  assert.match(evidence, /\[p17\].*role=limitation/);
  assert.ok(evidence.length <= 60_000);

  const prompt = buildPaperMapUserPrompt({
    title: "A complete paper",
    blocks,
    findings,
    chunkOverviews: ["Introduction summary", "Results summary"],
    lang: "en",
    level: "undergrad",
  });
  assert.match(prompt, /A complete paper/);
  assert.match(prompt, /\[chunk 2\] Results summary/);
});
