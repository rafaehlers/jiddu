import assert from "node:assert/strict";
import test from "node:test";
import type { IngestedDocument, IngestedPage } from "./ingest/url";
import { splitAcademicPdf, splitExplainDocument } from "./paper-structure";
import { splitBlocks } from "./paragraphs";

const heading = (text: string, x: number, y: number, fontName = "Paper.Bold") => ({
  text,
  x,
  y,
  width: text.length * 5,
  height: 10,
  fontName,
  fontHeight: 11,
  fillColor: "ff173f8a",
  rotation: 0,
});

const body = (text: string, x: number, y: number) => ({
  text,
  x,
  y,
  width: text.length * 4,
  height: 10,
  fontName: "Paper.Body",
  fontHeight: 10,
  fillColor: "ff000000",
  rotation: 0,
});

function page(pageNumber: number, markdown: string, items: IngestedPage["textItems"]): IngestedPage {
  return {
    pageNumber,
    markdown,
    text: markdown,
    width: 612,
    height: 792,
    textItems: items,
  };
}

test("uses typographic headings and joins a section across pages", () => {
  const pages = [
    page(
      1,
      `JOURNAL OF TESTS 1

ABSTRACT A concise summary of the study.

Introduction Pain is complex, and people are interested in learning`,
      [
        body("JOURNAL OF TESTS", 390, 28),
        heading("ABSTRACT", 60, 100),
        body("A concise summary of the study.", 60, 120),
        heading("Introduction", 60, 180),
        body("Pain is complex, and people are interested in learning", 60, 200),
      ],
    ),
    page(
      2,
      `2 A. AUTHOR ET AL.

more about it before choosing a treatment.

Methods The authors searched several databases.

Search strategy An electronic search was performed.

References Smith J 2024. A cited work.`,
      [
        body("JOURNAL OF TESTS", 390, 28),
        body("A. AUTHOR ET AL.", 60, 28),
        body("more about it before choosing a treatment.", 60, 55),
        heading("Methods", 315, 55),
        body("The authors searched several databases.", 315, 75),
        heading("Search strategy", 315, 130, "Paper.BoldItalic"),
        body("An electronic search was performed.", 315, 150),
        heading("References", 315, 220),
        body("Smith J 2024. A cited work.", 315, 240),
      ],
    ),
  ];
  const doc: IngestedDocument = {
    title: "Test paper",
    text: pages.map((item) => item.markdown).join("\n\n"),
    source: "pdf",
    sourceRef: "test.pdf",
    parser: "liteparse",
    pages,
  };

  const blocks = splitExplainDocument(doc);
  assert.deepEqual(
    Array.from(new Set(blocks.map((block) => block.section))),
    ["ABSTRACT", "Introduction", "Methods", "Search strategy", "References"],
  );
  const introduction = blocks
    .filter((block) => block.section === "Introduction")
    .map((block) => block.text)
    .join(" ");
  assert.match(introduction, /learning more about it/);
  assert.ok(!blocks.some((block) => /AUTHOR ET AL|JOURNAL OF TESTS/.test(block.section ?? "")));
  assert.ok(blocks.filter((block) => block.section === "References").every((block) => block.kind === "references"));
});

test("does not promote a prose fragment to a heading", () => {
  const pages = [
    page(
      1,
      `Introduction

Critical appraisal of each included study was conducted by two reviewers.`,
      [
        heading("Introduction", 60, 100),
        body("Critical appraisal of each included study was conducted", 60, 130),
        body("by two reviewers.", 60, 145),
      ],
    ),
    page(
      2,
      `Methods

The procedure was preregistered.`,
      [
        heading("Methods", 60, 100),
        body("The procedure was preregistered.", 60, 130),
      ],
    ),
  ];
  const blocks = splitExplainDocument({
    title: "Test",
    text: "",
    source: "pdf",
    sourceRef: "test.pdf",
    pages,
  });

  assert.deepEqual(
    Array.from(new Set(blocks.map((block) => block.section))),
    ["Introduction", "Methods"],
  );
});

test("uses numbered Markdown headings when the number and title are separate PDF items", () => {
  const pages = [
    page(
      1,
      `## Abstract

Summary of the paper.`,
      [
        heading("Abstract", 60, 100),
        body("Summary of the paper.", 60, 130),
      ],
    ),
    page(
      2,
      `## 1 Introduction

Opening argument.`,
      [
        body("1", 60, 100),
        heading("Introduction", 80, 100),
        body("Opening argument.", 60, 130),
      ],
    ),
    page(
      3,
      `## 2 Results

Main result.`,
      [
        body("2", 60, 100),
        heading("Results", 80, 100),
        body("Main result.", 60, 130),
      ],
    ),
  ];

  const blocks = splitAcademicPdf(pages);
  assert.deepEqual(
    Array.from(new Set(blocks.map((block) => block.section))),
    ["Abstract", "1 Introduction", "2 Results"],
  );
  assert.equal(blocks.find((block) => block.section === "Abstract")?.sectionLevel, 1);
});

test("uses the PDF outline for arbitrary author-defined section titles", () => {
  const pages = [
    page(
      1,
      `## Abstract

Summary of the paper.`,
      [
        heading("Abstract", 60, 100),
        body("Summary of the paper.", 60, 130),
      ],
    ),
    page(
      2,
      `## Conceptual lens

The authors define their conceptual lens.`,
      [
        body("Conceptual lens", 60, 100),
        body("The authors define their conceptual lens.", 60, 130),
      ],
    ),
  ];

  const blocks = splitAcademicPdf(pages, [
    { title: "Conceptual lens", pageNumber: 2, level: 1 },
  ]);
  assert.deepEqual(
    Array.from(new Set(blocks.map((block) => block.section))),
    ["Abstract", "Conceptual lens"],
  );
});

test("keeps bold bibliography entries inside References until the appendix", () => {
  const authorHeading =
    "Butinda, Lewis Dunia, Aimable A Lameke, Nathan Nunn, Max Posch, and Raul Sanchez";
  const pages = [
    page(
      1,
      `## Abstract

Summary of the paper.`,
      [
        heading("Abstract", 60, 100),
        body("Summary of the paper.", 60, 130),
      ],
    ),
    page(
      2,
      `## References

Angelucci, Manuela and Daniel Bennett. A cited work.`,
      [
        heading("References", 60, 100),
        heading("Angelucci, Manuela and Daniel Bennett", 60, 130),
        body("A cited work.", 60, 150),
      ],
    ),
    page(
      3,
      `#### ${authorHeading}

de la Sierra. A second cited work, 2023.`,
      [
        heading(authorHeading, 60, 100),
        body("de la Sierra. A second cited work, 2023.", 60, 130),
      ],
    ),
    page(
      4,
      `## Online Appendix

Supplementary analysis.`,
      [
        heading("Online Appendix", 60, 100),
        body("Supplementary analysis.", 60, 130),
      ],
    ),
  ];

  const blocks = splitAcademicPdf(pages);
  assert.deepEqual(
    Array.from(new Set(blocks.map((block) => block.section))),
    ["Abstract", "References", "Online Appendix"],
  );
  assert.ok(
    blocks
      .filter((block) => block.text.includes("Butinda"))
      .every((block) => block.kind === "references"),
  );
});

test("uses first-line indents instead of artificial character cuts", () => {
  const pages = [
    page(
      1,
      `Introduction First paragraph continues and ends here. Second paragraph starts and continues across pages`,
      [
        heading("Introduction", 60, 100),
        body("First paragraph continues", 60, 130),
        body("and ends here.", 60, 145),
        body("Second paragraph starts", 72, 165),
        body("and continues across pages", 60, 180),
      ],
    ),
    page(
      2,
      `before ending. Third paragraph starts and finishes.\n\nMethods The method follows.`,
      [
        body("before ending.", 60, 100),
        body("Third paragraph starts and finishes.", 72, 120),
        heading("Methods", 315, 180),
        body("The method follows.", 315, 200),
      ],
    ),
  ];

  const blocks = splitAcademicPdf(pages);
  const introduction = blocks.filter((block) => block.section === "Introduction");
  assert.equal(introduction.length, 3);
  assert.deepEqual(
    introduction.map((block) => block.text),
    [
      "First paragraph continues and ends here.",
      "Second paragraph starts and continues across pages before ending.",
      "Third paragraph starts and finishes.",
    ],
  );
  assert.deepEqual(
    introduction.map((block) => [block.pageStart, block.pageEnd]),
    [[1, 1], [1, 2], [2, 2]],
  );
});

test("matches an indented paragraph marker across line-end dehyphenation", () => {
  const blocks = splitAcademicPdf([
    page(
      1,
      `Introduction First paragraph ends. The second observation highlights differences between approaches.`,
      [
        heading("Introduction", 60, 100),
        body("First paragraph ends.", 60, 130),
        body("The second observation highlights differ-", 72, 150),
        body("ences between approaches.", 60, 165),
      ],
    ),
  ]);
  assert.deepEqual(
    blocks.map((block) => block.text),
    [
      "First paragraph ends.",
      "The second observation highlights differences between approaches.",
    ],
  );
});

test("keeps flowchart labels out of section prose", () => {
  const blocks = splitAcademicPdf([
    page(
      1,
      `Results Search strategy yield Initially there were many records and the authors screened them carefully.

Number of hits for databases and secondary searches n=25911

Not eligible n=24,798

Review of and abstract «Not published in the English language «Did not utilize TNE Conference abstract or dissertation Potentially cligible

Figure 1 Retrieval and review process.

Discussion The remaining studies were discussed.`,
      [
        heading("Results", 60, 100),
        heading("Search strategy yield", 60, 120, "Paper.BoldItalic"),
        body("Initially there were many records and the authors screened them carefully.", 60, 145),
        body("Number of hits for databases and secondary searches", 60, 180),
        body("Not eligible n=24,798", 60, 195),
        heading("Discussion", 315, 120),
        body("The remaining studies were discussed.", 315, 145),
      ],
    ),
  ]);

  assert.ok(
    !blocks.some((block) =>
      /n=25|not eligible|potentially cligible|did not utilize/i.test(block.text),
    ),
  );
  assert.ok(blocks.some((block) => block.section === "Search strategy yield"));
});

test("classifies inline and multilingual references before fallback", () => {
  const blocks = splitBlocks(
    `Introdução\n\nTexto principal.\n\nReferências Silva, A. (2024). Estudo citado.`,
  );
  assert.ok(blocks.some((block) => block.section === "Introdução"));
  assert.ok(
    blocks
      .filter((block) => /Silva/.test(block.text))
      .every((block) => block.kind === "references"),
  );
});

test("does not mistake prose beginning with References for a bibliography", () => {
  const blocks = splitBlocks(
    `Introduction\n\nReferences to earlier work are discussed here. The argument continues.\n\nMethods\n\nThe method follows.`,
  );
  const prose = blocks.find((block) => /References to earlier/.test(block.text));
  assert.equal(prose?.kind, "content");
  assert.equal(prose?.section, "Introduction");
});

test("reconstructs a two-column page from layout instead of corrupt Markdown order", () => {
  const leftLines = Array.from({ length: 20 }, (_, index) =>
    body(
      index === 19 ? "left continuation ends." : `left continuation ${index}`,
      60,
      70 + index * 12,
    ),
  );
  const rightLines = Array.from({ length: 19 }, (_, index) =>
    body(index === 18 ? "right method ends." : `right method ${index}`, 315, 70 + index * 12),
  );
  const blocks = splitAcademicPdf([
    page(
      1,
      `ABSTRACT Summary.\n\nIntroduction Opening continues`,
      [
        heading("ABSTRACT", 60, 100),
        body("Summary.", 60, 120),
        heading("Introduction", 60, 160),
        body("Opening continues", 60, 180),
      ],
    ),
    page(
      2,
      `Methods right method text left continuation text`,
      [
        ...leftLines,
        heading("Methods", 315, 45),
        ...rightLines,
      ],
    ),
  ]);

  const introduction = blocks
    .filter((block) => block.section === "Introduction")
    .map((block) => block.text)
    .join(" ");
  const methods = blocks
    .filter((block) => block.section === "Methods")
    .map((block) => block.text)
    .join(" ");
  assert.match(introduction, /Opening continues left continuation 0/);
  assert.match(introduction, /left continuation ends\./);
  assert.doesNotMatch(introduction, /right method/);
  assert.match(methods, /right method 0/);
  assert.match(methods, /right method ends\./);
});

test("does not turn a body continuation that starts with heading words into a new section", () => {
  const leftLines = Array.from({ length: 20 }, (_, index) =>
    body(`left continuation ${index}`, 60, 70 + index * 12),
  );
  const rightLines = Array.from({ length: 18 }, (_, index) =>
    body(`eligibility explanation ${index}`, 315, 70 + index * 12),
  );
  const blocks = splitAcademicPdf([
    page(
      1,
      `Introduction Opening paragraph.`,
      [
        heading("Introduction", 60, 100),
        body("Opening paragraph.", 60, 120),
      ],
    ),
    page(
      2,
      `Inclusion criteria body text in two columns`,
      [
        ...leftLines,
        heading("Inclusion criteria", 315, 45, "Paper.BoldItalic"),
        ...rightLines,
        body("inclusion criteria were retrieved for quality assessment", 315, 310),
        body("and data extraction.", 315, 322),
      ],
    ),
  ]);

  const inclusion = blocks.filter(
    (block) => block.section === "Inclusion criteria",
  );
  assert.equal(new Set(inclusion.map((block) => block.sectionId)).size, 1);
  assert.match(
    inclusion.map((block) => block.text).join(" "),
    /inclusion criteria were retrieved for quality assessment and data extraction\./,
  );
});

test("keeps mixed-page table cells out of two-column narrative", () => {
  const narrativeMarkdown = Array.from(
    { length: 16 },
    (_, index) => `Narrative line ${index} about the review procedure.`,
  ).join("\n");
  const leftItems = Array.from({ length: 18 }, (_, index) =>
    body(`left narrative ${index}`, 60, 70 + index * 12),
  );
  const rightItems = Array.from({ length: 18 }, (_, index) =>
    body(`right narrative ${index}`, 315, 70 + index * 12),
  );
  const blocks = splitAcademicPdf([
    page(
      1,
      `Introduction Opening paragraph.`,
      [
        heading("Introduction", 60, 100),
        body("Opening paragraph.", 60, 120),
      ],
    ),
    page(
      2,
      `Data extraction

${narrativeMarkdown}

| Stage | Total |
| --- | --- |
| Eligible articles | 13 |
| Total N Y Y | 11 |
| Included | 9 |

Results

The synthesis retained the eligible studies.`,
      [
        heading("Data extraction", 60, 45, "Paper.BoldItalic"),
        ...leftItems,
        body("Eligible articles for this systematic review", 90, 330),
        body("Total N Y Y", 120, 345),
        heading("Results", 315, 45),
        ...rightItems,
      ],
    ),
  ]);

  assert.ok(blocks.some((block) => block.section === "Data extraction"));
  assert.ok(blocks.some((block) => block.section === "Results"));
  assert.ok(!blocks.some((block) => /Eligible articles|Total N Y Y/.test(block.text)));
});
