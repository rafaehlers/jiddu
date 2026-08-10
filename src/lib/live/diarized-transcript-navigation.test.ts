import assert from "node:assert/strict";
import test from "node:test";
import type { DiarizedSpeakerTurn } from "./diarization";
import {
  findDiarizedTurnAtTime,
  resolveDiarizedTurnTimeForSentence,
  resolveSentenceAudioTime,
} from "./diarized-transcript-navigation";

const turns: DiarizedSpeakerTurn[] = [
  {
    id: "turn-a",
    speaker: "A",
    start: 0,
    end: 4,
    text: "Uma abertura que não coincide com a transcrição ao vivo.",
  },
  {
    id: "turn-b",
    speaker: "B",
    start: 8,
    end: 12,
    text: "O presidente Lula confirmou a participação no encontro.",
  },
];

test("matches a clicked sentence to the identified turn by text", () => {
  assert.equal(
    resolveDiarizedTurnTimeForSentence({
      sentenceId: "s1",
      transcript:
        "Primeiro trecho diferente. O presidente Lula confirmou participação no encontro.",
      durationMs: 12_000,
      events: [],
      turns,
    }),
    10,
  );
});

test("uses transcript delta timing when text differs", () => {
  assert.equal(
    resolveSentenceAudioTime({
      sentenceId: "s1",
      transcript: "Primeiro trecho. Segundo trecho.",
      durationMs: 12_000,
      events: [
        {
          kind: "transcript_delta",
          elapsedMs: 2_000,
          payload: { delta: "Primeiro trecho. " },
        },
        {
          kind: "transcript_delta",
          elapsedMs: 9_000,
          payload: { delta: "Segundo trecho." },
        },
      ],
    }),
    9,
  );
});

test("falls back to transcript position when delta history drifted", () => {
  assert.equal(
    resolveSentenceAudioTime({
      sentenceId: "s1",
      transcript: "Primeira. Segunda.",
      durationMs: 20_000,
      events: [
        {
          kind: "transcript_delta",
          elapsedMs: 19_000,
          payload: { delta: "Uma revisão incompatível e muito mais longa." },
        },
      ],
    }),
    15.555555555555555,
  );
});

test("finds the containing turn or the nearest turn in a gap", () => {
  assert.equal(findDiarizedTurnAtTime(turns, 10)?.id, "turn-b");
  assert.equal(findDiarizedTurnAtTime(turns, 6.5)?.id, "turn-b");
});
