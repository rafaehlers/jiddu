import assert from "node:assert/strict";
import test from "node:test";
import {
  sanitizePaperEvidenceFirstResult,
  sanitizePaperSynthesis,
} from "./explain-schema";
import {
  buildPaperEvidenceSystemPrompt,
  buildPaperEvidenceUserPrompt,
  selectPaperEvidenceBlocks,
} from "./paper-evidence-prompt";
import type { Block } from "./paragraphs";

const blocks: Block[] = [
  { id: "intro", start: 0, end: 10, text: "The abstract claims success." },
  { id: "method", start: 11, end: 20, text: "We sampled twenty cases." },
  { id: "result", start: 21, end: 30, text: "Twelve cases improved." },
  { id: "discussion", start: 31, end: 40, text: "The authors call it decisive." },
];

test("evidence-first selection excludes author framing", () => {
  const roles = new Map([
    ["intro", "background"],
    ["method", "method"],
    ["result", "result"],
    ["discussion", "interpretation"],
  ]);
  const selected = selectPaperEvidenceBlocks(blocks, roles);
  assert.deepEqual(
    selected.map((block) => block.id),
    ["method", "result"],
  );

  const prompt = buildPaperEvidenceUserPrompt({
    title: "A test paper",
    blocks: selected,
    visualPages: [],
    lang: "en",
    level: "undergrad",
  });
  assert.match(prompt, /We sampled twenty cases/);
  assert.match(prompt, /Twelve cases improved/);
  assert.doesNotMatch(prompt, /abstract claims success/);
  assert.doesNotMatch(prompt, /authors call it decisive/);
});

test("evidence-first prompt uses the shared audience profile", () => {
  const prompt = buildPaperEvidenceSystemPrompt("pt", "undergrad");

  assert.match(prompt, /16 to 25 words per sentence/);
  assert.match(prompt, /Do not exceed 30 words/);
  assert.match(prompt, /introductory research methods/);
  assert.match(prompt, /Preserve every fact, number/);
});

test("guided reading sanitizes nested evidence links", () => {
  const statement = (text: string, blockIds: string[]) => ({ text, blockIds });
  const synthesis = sanitizePaperSynthesis(
    {
      overview: "Overview",
      paperMap: {
        paperTypes: ["Empirical"],
        contributionTypes: ["Replication"],
        researchQuestion: statement("Question", ["intro"]),
        contribution: null,
        approach: statement("Method", ["method"]),
        mainAnswer: statement("Result", ["result"]),
        evidence: null,
        statedLimitation: null,
        quickScan: {
          category: statement("Empirical paper", ["intro", "invented"]),
          context: null,
          apparentCorrectness: null,
          contributions: null,
          clarity: null,
        },
        evidenceChain: {
          bigQuestion: statement("Big question", ["intro"]),
          specificQuestion: null,
          method: statement("Method", ["method"]),
          result: statement("Result", ["result"]),
          interpretation: statement("Interpretation", ["discussion"]),
          conclusion: null,
        },
        notebook: {
          keyTerms: [
            { term: " Sample ", meaning: " Cases studied ", blockIds: ["method", "fake"] },
          ],
          questionsForAuthors: [statement("Why twenty?", ["method", "fake"])],
          confusingPassages: [],
          implicitAssumptions: [],
          furtherReading: [],
        },
        challenge: null,
      },
    },
    new Set(blocks.map((block) => block.id)),
  );

  assert.deepEqual(synthesis.paperMap.quickScan?.category?.blockIds, ["intro"]);
  assert.deepEqual(synthesis.paperMap.notebook?.keyTerms[0], {
    term: "Sample",
    meaning: "Cases studied",
    blockIds: ["method"],
  });
  assert.deepEqual(
    synthesis.paperMap.notebook?.questionsForAuthors[0].blockIds,
    ["method"],
  );
});

test("evidence-first result removes invented block ids", () => {
  const sanitized = sanitizePaperEvidenceFirstResult(
    {
      methodSummary: { text: " Method ", blockIds: ["method", "fake"] },
      resultSummary: { text: " Result ", blockIds: ["result"] },
      independentInterpretation: null,
      uncertainties: [{ text: " Uncertain ", blockIds: ["fake", "result"] }],
      visualAudit: [
        {
          pageNumber: 2,
          label: " Figure 1 ",
          assessment: " Axes are labelled. ",
          concern: " ",
        },
      ],
    },
    new Set(["method", "result"]),
  );
  assert.deepEqual(sanitized.methodSummary?.blockIds, ["method"]);
  assert.deepEqual(sanitized.uncertainties[0].blockIds, ["result"]);
  assert.equal(sanitized.visualAudit[0].concern, null);
});
