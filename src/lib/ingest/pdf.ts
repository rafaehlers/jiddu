import type { IngestedDocument } from "./url";

export async function ingestPdf(buffer: ArrayBuffer, filename: string): Promise<IngestedDocument> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: true,
  });
  const doc = await loadingTask.promise;

  const pageTexts: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const items = content.items as Array<{ str?: string; hasEOL?: boolean }>;
    const pieces: string[] = [];
    for (const item of items) {
      if (typeof item.str === "string") pieces.push(item.str);
      if (item.hasEOL) pieces.push("\n");
    }
    pageTexts.push(pieces.join("").replace(/[ \t]+/g, " "));
  }

  const text = dehyphenate(pageTexts.join("\n\n"))
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

  return { title, text, source: "pdf", sourceRef: filename };
}

// Rejoin words split by a hyphen at a line break — common in justified PDF
// text, where "self-\nreferent" is really the single word "selfreferent".
// We only merge when the continuation is lowercase (the unambiguous
// wrapped-word case); a capitalized continuation like "Anglo-\nSaxon" is left
// alone so we don't fuse a hyphenated proper compound or a sentence boundary.
function dehyphenate(text: string): string {
  return text.replace(/([A-Za-zÀ-ÿ])-[ \t]*\n[ \t]*([a-zà-ÿ])/g, "$1$2");
}
