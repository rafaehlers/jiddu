import { capExplainBlocks } from "@/lib/explain-units";
import type { Block } from "@/lib/paragraphs";
import { splitBlocks } from "@/lib/paragraphs";
import { splitExplainDocument } from "@/lib/paper-structure";
import type { Sentence } from "@/lib/schema";
import { splitSentences } from "@/lib/sentences";
import type { IngestedDocument } from "@/lib/ingest/url";

export type PreparedAnalysisDocument = {
  text: string;
  blocks: Block[];
  sentences: Sentence[];
};

/**
 * Normalize every analysis source into the same structural contract used by
 * the paper explainer. Models still receive sentence ids, while readers keep
 * section/paragraph boundaries and can separate references from argument.
 */
export function prepareAnalysisDocument(
  doc: IngestedDocument,
  maxChars: number,
): PreparedAnalysisDocument {
  const detected = capExplainBlocks(splitExplainDocument(doc), maxChars);
  const blocks = normalizeBlockOffsets(detected);
  const text = blocks.map((block) => block.text).join("\n\n");
  const sentences: Sentence[] = [];

  for (const block of blocks) {
    if ((block.kind ?? "content") !== "content") continue;
    for (const sentence of splitSentences(block.text)) {
      const containsQuotation =
        block.editorialKind === "quote" || hasQuotation(sentence.text);
      sentences.push({
        id: `s${sentences.length}`,
        start: block.start + sentence.start,
        end: block.start + sentence.end,
        text: sentence.text,
        ...(block.editorialKind
          ? { editorialKind: block.editorialKind }
          : {}),
        ...(containsQuotation
          ? { containsQuotation: true }
          : {}),
        ...(block.section !== undefined ? { section: block.section } : {}),
        ...(block.quoteAttribution
          ? { quoteAttribution: block.quoteAttribution }
          : {}),
      });
    }
  }

  return { text, blocks, sentences };
}

function hasQuotation(text: string): boolean {
  return /(?:“[^”]{2,}”|"[^"]{2,}"|‘[^’]{2,}’|'[^']{2,}')/.test(text);
}

/** Existing rows have no persisted blocks. Recover conservative paragraph and
 * heading structure from their normalized text so the new reader remains
 * backward-compatible without pretending to have PDF layout metadata. */
export function readAnalysisBlocks(raw: string, text: string): Block[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      const valid = parsed.filter(isBlock);
      if (valid.length > 0) return valid;
    }
  } catch {
    // Fall through to the conservative legacy reconstruction.
  }
  return splitBlocks(text);
}

function normalizeBlockOffsets(blocks: Block[]): Block[] {
  let offset = 0;
  return blocks.flatMap((block, index) => {
    const text = block.text.trim();
    if (!text) return [];
    const start = offset;
    const end = start + text.length;
    offset = end + 2;
    return [{ ...block, id: `b${index}`, start, end, text }];
  });
}

function isBlock(value: unknown): value is Block {
  if (!value || typeof value !== "object") return false;
  const block = value as Partial<Block>;
  return (
    typeof block.id === "string" &&
    typeof block.start === "number" &&
    Number.isInteger(block.start) &&
    block.start >= 0 &&
    typeof block.end === "number" &&
    Number.isInteger(block.end) &&
    block.end >= block.start &&
    typeof block.text === "string"
  );
}
