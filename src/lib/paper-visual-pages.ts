import type { IngestedPage, PdfPageComplexity } from "./ingest/url";

/** Select the small set of PDF pages whose figures/tables need visual reading. */
export function selectVisualPages(
  pages: IngestedPage[],
  complexity: PdfPageComplexity[] | undefined,
): number[] {
  const selected = new Set<number>();
  for (const page of complexity ?? []) {
    const layoutNeedsVision =
      (page.layout?.ruledTableCount ?? 0) > 0 ||
      (page.layout?.textTableRunCount ?? 0) > 0 ||
      (page.layout?.figureCount ?? 0) > 0 ||
      page.layout?.reasons.some((reason) =>
        ["table-likely", "dense-graphics"].includes(reason),
      );
    if (
      page.hasSubstantialImages ||
      page.isGarbled ||
      layoutNeedsVision ||
      page.reasons.some((reason) =>
        ["scanned", "embedded-images", "vector-text"].includes(reason),
      )
    ) {
      selected.add(page.pageNumber);
    }
  }
  for (const page of pages) {
    if (
      /(?:^|\n)\s*(?:figure|fig\.|table|algorithm|architecture)\s+\d+/im.test(
        page.text,
      )
    ) {
      selected.add(page.pageNumber);
    }
  }
  return Array.from(selected)
    .sort((a, b) => a - b)
    .slice(0, 6);
}
