import type { DiarizedSpeakerTurn } from "./diarization";
import { splitSentences } from "../sentences";

export type TranscriptTimingEvent = {
  kind: string;
  elapsedMs: number;
  payload: unknown;
};

type ResolveDiarizedTurnInput = {
  sentenceId: string;
  transcript: string;
  durationMs: number;
  events: readonly TranscriptTimingEvent[];
  turns: readonly DiarizedSpeakerTurn[];
};

export function resolveDiarizedTurnTimeForSentence({
  sentenceId,
  transcript,
  durationMs,
  events,
  turns,
}: ResolveDiarizedTurnInput): number | null {
  const sentence = splitSentences(transcript).find(
    (candidate) => candidate.id === sentenceId,
  );
  if (!sentence || turns.length === 0) return null;

  const textMatch = findBestTextMatch(sentence.text, turns);
  if (textMatch) return midpoint(textMatch.start, textMatch.end);

  const time = resolveSentenceAudioTime({
    sentenceId,
    transcript,
    durationMs,
    events,
  });
  if (time === null) return null;

  const turn = findDiarizedTurnAtTime(turns, time);
  return turn ? midpoint(turn.start, turn.end) : null;
}

export function resolveSentenceAudioTime({
  sentenceId,
  transcript,
  durationMs,
  events,
}: Omit<ResolveDiarizedTurnInput, "turns">): number | null {
  const sentence = splitSentences(transcript).find(
    (candidate) => candidate.id === sentenceId,
  );
  if (!sentence) return null;

  const targetPosition = midpoint(sentence.start, sentence.end);
  const deltas = events
    .filter((event) => event.kind === "transcript_delta")
    .map((event) => ({
      elapsedMs: event.elapsedMs,
      delta: readTranscriptDelta(event.payload),
    }))
    .filter((event): event is { elapsedMs: number; delta: string } =>
      Boolean(event.delta),
    )
    .sort((left, right) => left.elapsedMs - right.elapsedMs);

  const totalDeltaLength = deltas.reduce(
    (total, event) => total + event.delta.length,
    0,
  );
  const deltaDrift =
    transcript.length > 0
      ? Math.abs(totalDeltaLength - transcript.length) / transcript.length
      : 1;

  if (deltas.length > 0 && deltaDrift <= 0.2) {
    let capturedLength = 0;
    for (const event of deltas) {
      capturedLength += event.delta.length;
      if (capturedLength >= targetPosition) {
        return clampSeconds(event.elapsedMs / 1_000, durationMs);
      }
    }
  }

  if (transcript.length === 0 || durationMs <= 0) return null;
  return clampSeconds(
    (targetPosition / transcript.length) * (durationMs / 1_000),
    durationMs,
  );
}

export function findDiarizedTurnAtTime(
  turns: readonly DiarizedSpeakerTurn[],
  seconds: number,
): DiarizedSpeakerTurn | null {
  let closest: DiarizedSpeakerTurn | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const turn of turns) {
    const distance =
      seconds < turn.start
        ? turn.start - seconds
        : seconds > turn.end
          ? seconds - turn.end
          : 0;
    if (distance < closestDistance) {
      closest = turn;
      closestDistance = distance;
    }
  }

  return closest;
}

function findBestTextMatch(
  sentenceText: string,
  turns: readonly DiarizedSpeakerTurn[],
): DiarizedSpeakerTurn | null {
  const sentence = normalizeText(sentenceText);
  if (!sentence) return null;

  let best: DiarizedSpeakerTurn | null = null;
  let bestScore = 0;
  for (const turn of turns) {
    const candidate = normalizeText(turn.text);
    if (!candidate) continue;
    if (candidate.includes(sentence) || sentence.includes(candidate)) {
      return turn;
    }

    const score = tokenMatchScore(sentence, candidate);
    if (score > bestScore) {
      best = turn;
      bestScore = score;
    }
  }

  return bestScore >= 0.58 ? best : null;
}

function tokenMatchScore(sentence: string, candidate: string) {
  const expected = new Set(
    sentence.split(" ").filter((token) => token.length >= 3),
  );
  const actual = new Set(
    candidate.split(" ").filter((token) => token.length >= 3),
  );
  if (expected.size < 2 || actual.size === 0) return 0;

  let matches = 0;
  for (const token of expected) {
    if (actual.has(token)) matches += 1;
  }
  const coverage = matches / expected.size;
  const union = new Set([...expected, ...actual]).size;
  const jaccard = union > 0 ? matches / union : 0;
  return coverage * 0.8 + jaccard * 0.2;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function readTranscriptDelta(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const delta = (payload as { delta?: unknown }).delta;
  return typeof delta === "string" && delta.length > 0 ? delta : null;
}

function midpoint(start: number, end: number) {
  return start + (end - start) / 2;
}

function clampSeconds(seconds: number, durationMs: number) {
  return Math.max(0, Math.min(seconds, Math.max(0, durationMs / 1_000)));
}
