import type { Sentence } from "./schema";

const ABBREVIATIONS = new Set([
  "sr", "sra", "srta", "dr", "dra", "exmo", "exma", "prof", "profa",
  "mr", "mrs", "ms", "dr", "jr", "sr", "st",
  "etc", "ex", "fig", "vs", "p", "pp", "n", "no", "art", "cap",
  "i.e", "e.g", "cf",
]);

export function splitSentences(text: string): Sentence[] {
  const sentences: Sentence[] = [];
  const normalized = text.replace(/\r\n/g, "\n");
  const len = normalized.length;

  let start = 0;
  let i = 0;
  let id = 0;

  while (i < len) {
    const ch = normalized[i];
    const isTerminal = ch === "." || ch === "!" || ch === "?" || ch === "\n";

    if (isTerminal) {
      let end = i + 1;

      if (ch === ".") {
        const prevWord = normalized.slice(Math.max(0, i - 6), i).match(/([A-Za-zÀ-ÿ]+)$/);
        const abbr = prevWord?.[1]?.toLowerCase();
        const nextChar = normalized[i + 1];
        const nextIsLower = nextChar && /[a-zà-ÿ]/.test(nextChar);
        const nextIsSpaceThenLower = nextChar === " " && /[a-zà-ÿ]/.test(normalized[i + 2] ?? "");
        if (abbr && ABBREVIATIONS.has(abbr) && (nextIsLower || nextIsSpaceThenLower || nextChar === " ")) {
          i++;
          continue;
        }

        while (end < len && (normalized[end] === "." || normalized[end] === "?" || normalized[end] === "!")) {
          end++;
        }
      }

      if (ch === "\n") {
        while (end < len && normalized[end] === "\n") end++;
      }

      const raw = normalized.slice(start, end);
      const trimmed = raw.trim();
      if (trimmed.length > 0) {
        const leadingWs = raw.length - raw.trimStart().length;
        const trailingWs = raw.length - raw.trimEnd().length;
        sentences.push({
          id: `s${id++}`,
          start: start + leadingWs,
          end: end - trailingWs,
          text: trimmed,
        });
      }
      start = end;
      i = end;
      continue;
    }
    i++;
  }

  if (start < len) {
    const raw = normalized.slice(start, len);
    const trimmed = raw.trim();
    if (trimmed.length > 0) {
      const leadingWs = raw.length - raw.trimStart().length;
      const trailingWs = raw.length - raw.trimEnd().length;
      sentences.push({
        id: `s${id++}`,
        start: start + leadingWs,
        end: len - trailingWs,
        text: trimmed,
      });
    }
  }

  return sentences;
}
