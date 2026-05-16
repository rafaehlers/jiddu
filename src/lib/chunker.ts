import type { Sentence } from "./schema";

export type Chunk = {
  index: number;
  sentences: Sentence[];
  chars: number;
};

const DEFAULT_TARGET = 12_000;
const DEFAULT_MIN_TO_SPLIT = 18_000;

export function chunkSentences(
  sentences: Sentence[],
  opts?: { target?: number; minToSplit?: number },
): Chunk[] {
  const target = opts?.target ?? DEFAULT_TARGET;
  const minToSplit = opts?.minToSplit ?? DEFAULT_MIN_TO_SPLIT;

  const totalChars = sentences.reduce((acc, s) => acc + s.text.length, 0);
  if (totalChars <= minToSplit) {
    return [{ index: 0, sentences, chars: totalChars }];
  }

  const chunks: Chunk[] = [];
  let current: Sentence[] = [];
  let currentChars = 0;

  for (const s of sentences) {
    if (currentChars > 0 && currentChars + s.text.length > target) {
      chunks.push({ index: chunks.length, sentences: current, chars: currentChars });
      current = [];
      currentChars = 0;
    }
    current.push(s);
    currentChars += s.text.length;
  }
  if (current.length > 0) {
    chunks.push({ index: chunks.length, sentences: current, chars: currentChars });
  }

  return chunks;
}
