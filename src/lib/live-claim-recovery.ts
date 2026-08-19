import type { Claim } from "./claims-schema";
import type { Sentence } from "./schema";

export const CLAIM_RECOVERY_CHUNK_CHARS = 16_000;
export const CLAIM_RECOVERY_CHUNK_SENTENCES = 100;
export const CLAIM_RECOVERY_MAX_CHUNKS = 8;

type AnchoredClaim = Pick<Claim, "sentenceIds" | "statement">;

export type LiveClaimRecoveryPlan = {
  chunks: Sentence[][];
  scannedSentenceIds: string[];
  scannedThroughSentenceId: string | null;
  hasMore: boolean;
};

export function planLiveClaimRecovery(input: {
  sentences: Sentence[];
  existingClaims: AnchoredClaim[];
  lastScannedSentenceId?: string | null;
  maxChunkChars?: number;
  maxChunkSentences?: number;
  maxChunks?: number;
}): LiveClaimRecoveryPlan {
  const indexById = new Map(
    input.sentences.map((sentence, index) => [sentence.id, index]),
  );
  const cursorIndex = input.lastScannedSentenceId
    ? indexById.get(input.lastScannedSentenceId)
    : undefined;
  const lastClaimIndex = input.existingClaims.reduce((highest, claim) => {
    return claim.sentenceIds.reduce(
      (claimHighest, sentenceId) =>
        Math.max(claimHighest, indexById.get(sentenceId) ?? -1),
      highest,
    );
  }, -1);
  const startIndex =
    cursorIndex !== undefined
      ? cursorIndex + 1
      : lastClaimIndex >= 0
        ? Math.max(0, lastClaimIndex - 2)
        : 0;
  const remaining = input.sentences.slice(startIndex);
  const maxChunkChars = Math.max(
    1,
    Math.floor(input.maxChunkChars ?? CLAIM_RECOVERY_CHUNK_CHARS),
  );
  const maxChunkSentences = Math.max(
    1,
    Math.floor(
      input.maxChunkSentences ?? CLAIM_RECOVERY_CHUNK_SENTENCES,
    ),
  );
  const maxChunks = Math.max(
    1,
    Math.floor(input.maxChunks ?? CLAIM_RECOVERY_MAX_CHUNKS),
  );
  const chunks: Sentence[][] = [];
  let current: Sentence[] = [];
  let currentChars = 0;
  let consumed = 0;

  for (const sentence of remaining) {
    const sentenceChars = sentence.text.length + sentence.id.length + 4;
    const wouldOverflow =
      current.length > 0 &&
      (currentChars + sentenceChars > maxChunkChars ||
        current.length >= maxChunkSentences);
    if (wouldOverflow) {
      chunks.push(current);
      if (chunks.length >= maxChunks) break;
      current = [];
      currentChars = 0;
    }
    current.push(sentence);
    currentChars += sentenceChars;
    consumed += 1;
  }
  if (current.length > 0 && chunks.length < maxChunks) chunks.push(current);

  const scanned = chunks.flat();
  return {
    chunks,
    scannedSentenceIds: scanned.map((sentence) => sentence.id),
    scannedThroughSentenceId: scanned.at(-1)?.id ?? null,
    hasMore: consumed < remaining.length,
  };
}

export function filterNewRecoveredClaims<T extends AnchoredClaim>(
  candidates: T[],
  existing: AnchoredClaim[],
): T[] {
  const accepted: T[] = [];
  for (const candidate of candidates) {
    if (
      [...existing, ...accepted].some((claim) =>
        claimsAreDuplicates(candidate, claim),
      )
    ) {
      continue;
    }
    accepted.push(candidate);
  }
  return accepted;
}

export function claimsAreDuplicates(
  left: AnchoredClaim,
  right: AnchoredClaim,
): boolean {
  const leftStatement = normalizeStatement(left.statement);
  const rightStatement = normalizeStatement(right.statement);
  if (!leftStatement || !rightStatement) return false;
  if (leftStatement === rightStatement) return true;

  const sharesSentence = left.sentenceIds.some((sentenceId) =>
    right.sentenceIds.includes(sentenceId),
  );
  if (!sharesSentence) return false;

  const leftTokens = new Set(leftStatement.split(" "));
  const rightTokens = new Set(rightStatement.split(" "));
  const intersection = [...leftTokens].filter((token) =>
    rightTokens.has(token),
  ).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union > 0 && intersection / union >= 0.78;
}

function normalizeStatement(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}
