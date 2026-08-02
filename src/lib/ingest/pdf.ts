import type {
  IngestedDocument,
  IngestedPage,
  PdfPageComplexity,
} from "./url";

export type PdfIngestOptions = {
  /**
   * The existing five pipelines only need clean prose. Academic mode keeps
   * page structure/Markdown and enables selective OCR when LiteParse says a
   * page needs it.
   */
  mode?: "fast" | "academic";
  ocrLanguage?: string;
};

export type PdfPageScreenshot = {
  pageNumber: number;
  width: number;
  height: number;
  png: Buffer;
};

export async function ingestPdf(
  buffer: ArrayBuffer,
  filename: string,
  options: PdfIngestOptions = {},
): Promise<IngestedDocument> {
  try {
    return await ingestWithLiteParse(buffer, filename, options);
  } catch (err) {
    // LiteParse is a native dependency. Keep the known-good pdfjs path as a
    // production escape hatch for an unsupported platform or a malformed PDF.
    console.warn(
      "[ingestPdf] LiteParse failed; falling back to pdfjs-dist:",
      err instanceof Error ? err.message : err,
    );
    return ingestWithPdfJs(buffer, filename);
  }
}

async function ingestWithLiteParse(
  buffer: ArrayBuffer,
  filename: string,
  options: PdfIngestOptions,
): Promise<IngestedDocument> {
  const { LiteParse } = await import("@llamaindex/liteparse");
  const bytes = new Uint8Array(buffer);
  const academic = options.mode === "academic";

  let complexity: PdfPageComplexity[] | undefined;
  let needsOcr = false;
  if (academic) {
    const probe = new LiteParse({
      ocrEnabled: false,
      outputFormat: "text",
      quiet: true,
    });
    const stats = await probe.isComplex(bytes);
    complexity = stats.map((page) => ({
      pageNumber: page.pageNumber,
      needsOcr: page.needsOcr,
      reasons: page.reasons,
      hasSubstantialImages: page.hasSubstantialImages,
      imageCoverage: page.imageCoverage,
      isGarbled: page.isGarbled,
      layout: page.layout
        ? {
            columnCount: page.layout.columnCount,
            ruledTableCount: page.layout.ruledTableCount,
            ruledTableCoverage: page.layout.ruledTableCoverage,
            textTableRunCount: page.layout.textTableRunCount,
            figureCount: page.layout.figureCount,
            figureCoverage: page.layout.figureCoverage,
            isComplex: page.layout.isComplex,
            reasons: page.layout.reasons,
          }
        : undefined,
    }));
    // A short title/references page is often labelled "sparse-text" but does
    // not benefit from OCR. Reserve the expensive path for signals that mean
    // the native text layer is actually missing or unusable.
    needsOcr = complexity.some((page) =>
      page.reasons.some((reason) =>
        ["scanned", "no-text", "garbled", "vector-text"].includes(reason),
      ),
    );
  }

  const parser = new LiteParse({
    ocrEnabled: academic && needsOcr,
    ocrLanguage: options.ocrLanguage ?? "eng",
    outputFormat: academic ? "markdown" : "text",
    imageMode: academic ? "placeholder" : "off",
    extractLinks: academic,
    extractTextMetadata: academic,
    // Papers benefit from removing repeated journal chrome and page numbers.
    // Keep this explicit so a future LiteParse default cannot change output.
    keepHeadersFooters: false,
    quiet: true,
    // A partial native-text result is more useful than discarding the whole
    // paper when OCR fails on one decorative or scanned page.
    ocrFailureFatal: false,
  });
  const result = await parser.parse(bytes);
  const pages: IngestedPage[] = result.pages.map((page) => ({
    pageNumber: page.pageNum,
    text: page.text.trim(),
    markdown: page.markdown.trim(),
    width: page.width,
    height: page.height,
    textItems: academic
      ? page.textItems.map((item) => ({
          text: item.text,
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
          fontName: item.fontName,
          fontSize: item.fontSize,
          fontHeight: item.fontHeight,
          fontWeight: item.fontWeight,
          fillColor: item.fillColor,
          rotation: item.rotation,
        }))
      : undefined,
  }));

  const text = academic
    ? pages
        .map((page) => page.markdown || page.text)
        .filter(Boolean)
        .join("\n\n")
        .trim()
    : dehyphenate(result.text).replace(/\n{3,}/g, "\n\n").trim();

  if (text.length < 40) {
    throw new Error("PDF appears to be empty or scanned without recoverable text");
  }

  return {
    title: inferTitle(pages, filename),
    text,
    source: "pdf",
    sourceRef: filename,
    pages,
    parser: "liteparse",
    complexity,
  };
}

export async function renderPdfPages(
  buffer: ArrayBuffer,
  pageNumbers: number[],
): Promise<PdfPageScreenshot[]> {
  if (pageNumbers.length === 0) return [];
  try {
    const { LiteParse } = await import("@llamaindex/liteparse");
    const parser = new LiteParse({
      ocrEnabled: false,
      dpi: 144,
      quiet: true,
    });
    const screenshots = await parser.screenshot(
      new Uint8Array(buffer),
      Array.from(new Set(pageNumbers)).sort((a, b) => a - b),
    );
    return screenshots.map((page) => ({
      pageNumber: page.pageNum,
      width: page.width,
      height: page.height,
      png: page.imageBuffer,
    }));
  } catch (err) {
    console.warn(
      "[renderPdfPages] LiteParse screenshot failed:",
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

async function ingestWithPdfJs(
  buffer: ArrayBuffer,
  filename: string,
): Promise<IngestedDocument> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: true,
  });
  const doc = await loadingTask.promise;

  const pages: IngestedPage[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const items = content.items as Array<{ str?: string; hasEOL?: boolean }>;
    const pieces: string[] = [];
    for (const item of items) {
      if (typeof item.str === "string") pieces.push(item.str);
      if (item.hasEOL) pieces.push("\n");
    }
    const pageText = dehyphenate(
      pieces.join("").replace(/[ \t]+/g, " "),
    ).trim();
    const viewport = page.getViewport({ scale: 1 });
    pages.push({
      pageNumber: p,
      text: pageText,
      markdown: pageText,
      width: viewport.width,
      height: viewport.height,
    });
  }

  const text = pages
    .map((page) => page.text)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (text.length < 40) {
    throw new Error("PDF appears to be empty or scanned without OCR");
  }

  const metadata = await doc.getMetadata().catch(() => null);
  const info = metadata?.info as Record<string, unknown> | undefined;
  const title =
    (typeof info?.Title === "string" && info.Title.trim()) ||
    filename.replace(/\.pdf$/i, "") ||
    null;

  return {
    title,
    text,
    source: "pdf",
    sourceRef: filename,
    pages,
    parser: "pdfjs",
  };
}

function inferTitle(pages: IngestedPage[], filename: string): string {
  const firstPage = pages[0];
  if (firstPage) {
    const markdownHeading = firstPage.markdown
      .split("\n")
      .map((line) => line.trim())
      .find((line) => /^#{1,2}\s+\S/.test(line));
    if (markdownHeading) {
      return markdownHeading.replace(/^#{1,2}\s+/, "").trim();
    }
  }
  return filename.replace(/\.pdf$/i, "") || "Untitled paper";
}

// Rejoin words split by a hyphen at a line break — common in justified PDF
// text. The tricky part is telling a wrapped single word ("suf-\nficiently"
// → "sufficiently") from a genuine hyphenated compound that happens to wrap
// at its hyphen ("self-\nreferent", which must stay "self-referent").
//
// Heuristic: intra-document consistency. First collect every compound that
// appears hyphenated *inline* elsewhere in the text; if a line-break split
// reconstructs one of those, it's a real compound — keep the hyphen.
// Otherwise drop it. Capitalized continuations are left untouched (proper
// compounds like "Anglo-\nSaxon", or a sentence boundary).
function dehyphenate(text: string): string {
  const inlineCompounds = new Set<string>();
  for (const m of text.matchAll(/([A-Za-zÀ-ÿ]+)-([A-Za-zÀ-ÿ]+)/g)) {
    inlineCompounds.add(`${m[1]}-${m[2]}`.toLowerCase());
  }
  return text.replace(
    /([A-Za-zÀ-ÿ]+)-[ \t]*\n[ \t]*([a-zà-ÿ]+)/g,
    (_full, a: string, b: string) =>
      inlineCompounds.has(`${a}-${b}`.toLowerCase()) ? `${a}-${b}` : `${a}${b}`,
  );
}
