import { splitSentences } from "./sentences";
import type { Sentence } from "./schema";

// The explain pipeline works at paragraph granularity: one explanation per
// paragraph. A "block" reuses the Sentence shape ({id,start,end,text}) so the
// chunker and the highlight viewer stay generic over the unit they carry,
// plus an optional `section` label — the paper's own heading (e.g. "2.1
// Related Work") that the paragraph lives under. The viewer renders those
// headings as section dividers in the text column; the model receives them
// as context. When a document has no detectable headings, every block's
// `section` is null and the view is a plain paragraph list.
export type BlockKind = "content" | "references";

export type Block = Sentence & {
  section?: string | null;
  kind?: BlockKind;
};

// When a document has no blank-line paragraph structure at all (some PDF
// extractions, pasted prose), we fall back to slicing the sentence run into
// pseudo-paragraphs of a few sentences each so the reader still gets
// digestible, separately-explained units instead of one wall of text.
const SENTENCES_PER_PSEUDO_PARAGRAPH = 4;

const NAMED_HEADING =
  /^(abstract|introduction|background|related works?|prior works?|literature review|motivations?|methods?|methodology|materials and methods|experimental (setup|design)|data|datasets?|results?|findings|discussions?|analysis|evaluation|conclusions?|concluding remarks|future work|limitations?|references|bibliography|acknowledge?ments?|appendix|appendices|supplementary)\b/i;

const REFERENCES_HEADING =
  /^(references|bibliography|works cited|literature cited|refer[eê]ncias|referencias|bibliograf[ií]a|bibliographie)$/i;

export function isReferencesHeading(line: string | null | undefined): boolean {
  if (!line) return false;
  const normalized = normalizeHeading(line)
    .replace(/^(?:(?:\d+(?:\.\d+){0,3}\.?|[IVXLC]+\.)\s+)/i, "")
    .replace(/[.:]\s*$/, "")
    .trim();
  return REFERENCES_HEADING.test(normalized);
}

function normalizeHeading(line: string): string {
  return line
    .trim()
    .replace(/^#{1,6}\s+/, "")
    .replace(/\s+#+$/, "")
    .trim();
}

// Heuristic: is this single line a section heading rather than body prose?
// Conservative on purpose — a false negative just means a missing divider,
// while the `headingCount < 2` gate below stops a stray false positive from
// switching the whole document into section mode.
function isHeading(line: string): boolean {
  const trimmed = line.trim();
  const markdownHeading = /^#{1,6}\s+\S/.test(trimmed);
  const s = normalizeHeading(trimmed);
  if (s.length === 0 || s.length > 100) return false;
  if (markdownHeading) return true;
  const words = s.split(/\s+/).length;
  if (words > 14) return false;
  // Numbered: "1 Introduction" / "1. Introduction" / "2.1 Related Work" /
  // "3.2.1 Foo". Require an uppercase letter after the number so "2.5 trillion"
  // and "4.1 percent" don't read as headings, and no terminal punctuation.
  if (/^\d+(\.\d+){0,3}\.?\s+[A-ZÀ-Ý][^.!?]*$/.test(s)) return true;
  // Roman-numeral sections: "IV. Discussion".
  if (/^[IVXLC]+\.\s+[A-ZÀ-Ý][^.!?]*$/.test(s)) return true;
  // Named section word at the start of a short line ("Methods", "Results and
  // Discussion") that doesn't read as a sentence.
  if (words <= 6 && NAMED_HEADING.test(s) && !/[.!?]$/.test(s)) return true;
  // ALL-CAPS short header ("MATERIALS AND METHODS").
  if (s.length <= 60 && /[A-Z]{3,}/.test(s) && /^[A-Z0-9][A-Z0-9 .,:&'’\-/()]+$/.test(s)) {
    return true;
  }
  return false;
}

export function splitBlocks(text: string): Block[] {
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  const blocks: Block[] = [];
  let para: string[] = [];
  let paraStart = 0;
  let currentSection: string | null = null;
  let currentKind: BlockKind = "content";
  let headingCount = 0;
  let offset = 0;
  let id = 0;

  const flushPara = (endOffset: number) => {
    const raw = para.join("\n").trim();
    if (raw.length > 0) {
      blocks.push({
        id: `p${id++}`,
        start: paraStart,
        end: endOffset,
        text: raw,
        section: currentSection,
        kind: currentKind,
      });
    }
    para = [];
  };

  for (const line of lines) {
    const lineStart = offset;
    offset += line.length + 1; // +1 for the consumed "\n"
    const trimmed = line.trim();

    if (trimmed === "") {
      flushPara(lineStart);
      continue;
    }
    if (isHeading(trimmed)) {
      flushPara(lineStart);
      currentSection = normalizeHeading(trimmed);
      currentKind = isReferencesHeading(currentSection) ? "references" : "content";
      headingCount++;
      continue;
    }
    if (para.length === 0) paraStart = lineStart;
    para.push(line);
  }
  flushPara(offset);

  // No real heading structure → drop the (possibly stray) labels and behave
  // like a plain paragraph list.
  if (headingCount < 2) {
    if (blocks.length <= 1) {
      // No blank-line structure either → use the sentence-grouping fallback.
      return splitParagraphs(text);
    }
    return blocks.map((b) => ({ ...b, section: null }));
  }

  return blocks;
}

// Paragraph-only segmentation (no heading detection). Used as the fallback
// path by splitBlocks for prose with no structure at all.
export function splitParagraphs(text: string): Block[] {
  const normalized = text.replace(/\r\n/g, "\n");
  const sentences = splitSentences(normalized);
  if (sentences.length === 0) return [];

  // Group consecutive sentences into paragraphs, breaking on a blank line
  // (one or more newlines surrounding whitespace) between them.
  const groups: Sentence[][] = [[sentences[0]]];
  for (let i = 1; i < sentences.length; i++) {
    const prev = sentences[i - 1];
    const cur = sentences[i];
    const between = normalized.slice(prev.end, cur.start);
    if (/\n\s*\n/.test(between)) {
      groups.push([cur]);
    } else {
      groups[groups.length - 1].push(cur);
    }
  }

  let finalGroups = groups;
  if (
    groups.length === 1 &&
    sentences.length > SENTENCES_PER_PSEUDO_PARAGRAPH * 2
  ) {
    finalGroups = [];
    for (let i = 0; i < sentences.length; i += SENTENCES_PER_PSEUDO_PARAGRAPH) {
      finalGroups.push(sentences.slice(i, i + SENTENCES_PER_PSEUDO_PARAGRAPH));
    }
  }

  return finalGroups.map((group, idx) => {
    const start = group[0].start;
    const end = group[group.length - 1].end;
    return {
      id: `p${idx}`,
      start,
      end,
      text: normalized.slice(start, end).trim(),
      section: null,
      kind: "content" as const,
    };
  });
}
