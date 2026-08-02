import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument } from "@napi-rs/canvas";
import { ingestPdf, renderPdfPages } from "./pdf";

function paperFixture(): ArrayBuffer {
  const pdf = new PDFDocument({
    title: "LiteParse integration fixture",
    author: "Jiddu Tests",
  });
  const page1 = pdf.beginPage(612, 792);
  page1.font = "24px serif";
  page1.fillText("Adversarial Review Fixture", 54, 72);
  page1.font = "12px serif";
  page1.fillText("Abstract", 54, 112);
  page1.fillText(
    "This paper proposes a testable method for evaluating structured reviews.",
    54,
    136,
  );
  pdf.endPage();

  const page2 = pdf.beginPage(612, 792);
  page2.font = "18px serif";
  page2.fillText("2 Methods", 54, 72);
  page2.font = "12px serif";
  page2.fillText(
    "The evaluation compares a treatment with a matched control condition.",
    54,
    104,
  );
  pdf.endPage();

  const buffer = pdf.close();
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

test("academic ingestion preserves pages with LiteParse", async () => {
  const pdf = paperFixture();
  const doc = await ingestPdf(pdf, "fixture.pdf", { mode: "academic" });

  assert.equal(doc.parser, "liteparse");
  assert.equal(doc.pages?.length, 2);
  assert.equal(doc.pages?.[0]?.pageNumber, 1);
  assert.match(doc.pages?.[0]?.text ?? "", /Adversarial Review Fixture/);
  assert.match(doc.pages?.[1]?.text ?? "", /matched control condition/);
  assert.equal(doc.complexity?.length, 2);
  assert.ok(doc.complexity?.every((page) => page.layout));
  assert.ok(
    doc.complexity?.every(
      (page) => typeof page.layout?.columnCount === "number",
    ),
  );
});

test("fast ingestion remains compatible with the existing text pipelines", async () => {
  const doc = await ingestPdf(paperFixture(), "fixture.pdf");

  assert.equal(doc.parser, "liteparse");
  assert.match(doc.text, /testable method/);
  assert.match(doc.text, /2 Methods/);
});

test("LiteParse renders selected pages for multimodal review", async () => {
  const screenshots = await renderPdfPages(paperFixture(), [2]);

  assert.equal(screenshots.length, 1);
  assert.equal(screenshots[0]?.pageNumber, 2);
  assert.ok((screenshots[0]?.png.byteLength ?? 0) > 100);
});
