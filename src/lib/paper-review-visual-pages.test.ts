import assert from "node:assert/strict";
import test from "node:test";
import type {
  IngestedPage,
  PdfPageComplexity,
} from "@/lib/ingest/url";
import { selectVisualPages } from "@/lib/paper-review-job";

const pages: IngestedPage[] = [1, 2, 3].map((pageNumber) => ({
  pageNumber,
  text: `Page ${pageNumber} without a textual figure caption.`,
  markdown: `Page ${pageNumber} without a textual figure caption.`,
}));

function complexity(
  pageNumber: number,
  layout: PdfPageComplexity["layout"],
): PdfPageComplexity {
  return {
    pageNumber,
    needsOcr: false,
    reasons: [],
    hasSubstantialImages: false,
    imageCoverage: 0,
    isGarbled: false,
    layout,
  };
}

test("selects table and figure layouts for multimodal paper review", () => {
  const selected = selectVisualPages(pages, [
    complexity(1, {
      columnCount: 2,
      ruledTableCount: 0,
      ruledTableCoverage: 0,
      textTableRunCount: 0,
      figureCount: 0,
      figureCoverage: 0,
      isComplex: true,
      reasons: ["multi-column"],
    }),
    complexity(2, {
      columnCount: 1,
      ruledTableCount: 1,
      ruledTableCoverage: 0.25,
      textTableRunCount: 0,
      figureCount: 0,
      figureCoverage: 0,
      isComplex: true,
      reasons: ["table-likely"],
    }),
    complexity(3, {
      columnCount: 1,
      ruledTableCount: 0,
      ruledTableCoverage: 0,
      textTableRunCount: 0,
      figureCount: 1,
      figureCoverage: 0.4,
      isComplex: true,
      reasons: ["dense-graphics"],
    }),
  ]);

  assert.deepEqual(selected, [2, 3]);
});
