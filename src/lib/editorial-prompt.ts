import type { EditorialMetadata } from "./ingest/url";
import type { Sentence } from "./schema";

export function formatEditorialSentences(sentences: Sentence[]): string {
  return sentences.map(formatEditorialSentence).join("\n");
}

export function buildEditorialContextBlock(
  metadata?: EditorialMetadata,
): string {
  if (!metadata) return "";
  const entries: [string, string | null | undefined][] = [
    ["title", metadata.title],
    ["publisher", metadata.siteName],
    ["author", metadata.author],
    ["published_at", metadata.publishedAt],
    ["modified_at", metadata.modifiedAt],
    ["section", metadata.articleSection],
    ["content_type", metadata.contentType],
    ["canonical_url", metadata.canonicalUrl],
    ["description", metadata.description],
  ];
  const fields = entries
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([key, value]) => `<${key}>${escapeXml(value)}</${key}>`)
    .join("\n");
  if (!fields) return "";

  return `\n\n<document_context>\n${fields}\n</document_context>\nThe document context is publisher-supplied metadata. Use it only to understand the document's provenance, genre, date and likely authorship. It is not evidence that any claim is true and it is not itself text to analyze.`;
}

export const EDITORIAL_STRUCTURE_GUIDANCE = `Sentence prefixes may include structural annotations such as kind=quote, kind=list_item, contains_quotation=true, section=..., or attributed_to=.... These annotations are context, not part of the sentence and must never be copied into quotes. A quote block is material presented by the page as a quotation; contains_quotation means the sentence mixes quoted material with narration. Attribute a statement to a speaker only when the sentence, nearby context, or attributed_to annotation explicitly supports it. Keep the quoted speaker's words distinct from the article author's narration and editorial framing.`;

function formatEditorialSentence(sentence: Sentence): string {
  const annotations: string[] = [];
  if (sentence.editorialKind) annotations.push(`kind=${sentence.editorialKind}`);
  if (sentence.containsQuotation) annotations.push("contains_quotation=true");
  if (sentence.section) annotations.push(`section=${quoteAnnotation(sentence.section)}`);
  if (sentence.quoteAttribution) {
    annotations.push(`attributed_to=${quoteAnnotation(sentence.quoteAttribution)}`);
  }
  const suffix = annotations.length > 0 ? `[${annotations.join(";")}]` : "";
  return `[${sentence.id}]${suffix} ${sentence.text}`;
}

function quoteAnnotation(value: string): string {
  const safe = value
    .replace(/[\r\n]+/g, " ")
    .replace(/[\[\];="\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
  return `"${safe}"`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
