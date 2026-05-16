import type { IngestedDocument } from "./url";
import { IngestError } from "./errors";

export function ingestText(text: string, opts?: { title?: string; sourceRef?: string }): IngestedDocument {
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (cleaned.length < 40) {
    throw new IngestError(
      "too_short",
      "Text is too short to analyze (need at least 40 characters)",
    );
  }
  return {
    title: opts?.title ?? null,
    text: cleaned,
    source: opts?.sourceRef ? "txt" : "paste",
    sourceRef: opts?.sourceRef ?? "paste",
  };
}
