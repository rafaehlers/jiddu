import assert from "node:assert/strict";
import test from "node:test";
import {
  createSavedDiarization,
  formatDiarizationTimestamp,
  groupDiarizedSegments,
  isSupportedDiarizationAudio,
  LOCAL_RECORDING_AUDIO_BITS_PER_SECOND,
  MAX_DIARIZATION_AUDIO_BYTES,
  readSavedDiarization,
  sanitizeDiarizationResult,
  sessionAudioFilename,
} from "./diarization";

test("sanitizes a diarized response and reads duration usage fallback", () => {
  const result = sanitizeDiarizationResult({
    text: "Hello. Hi.",
    usage: { seconds: 4.25 },
    segments: [
      {
        id: "seg_1",
        speaker: "A",
        start: 0,
        end: 1.5,
        text: " Hello. ",
      },
      {
        speaker: "B",
        start: 1.5,
        end: 4.25,
        text: "Hi.",
      },
      {
        speaker: "C",
        start: 5,
        end: 4,
        text: "Invalid timing",
      },
    ],
  });

  assert.deepEqual(result, {
    text: "Hello. Hi.",
    duration: 4.25,
    segments: [
      {
        id: "seg_1",
        speaker: "A",
        start: 0,
        end: 1.5,
        text: "Hello.",
      },
      {
        id: "segment-2",
        speaker: "B",
        start: 1.5,
        end: 4.25,
        text: "Hi.",
      },
    ],
  });
});

test("rejects responses without valid speaker segments", () => {
  assert.equal(sanitizeDiarizationResult({ segments: [] }), null);
  assert.equal(
    sanitizeDiarizationResult({
      segments: [{ speaker: "", start: 0, end: 1, text: "Hello" }],
    }),
    null,
  );
});

test("groups nearby consecutive segments from the same speaker", () => {
  const turns = groupDiarizedSegments([
    { id: "1", speaker: "A", start: 0, end: 1, text: "Hello." },
    { id: "2", speaker: "A", start: 1.2, end: 2, text: "Still me." },
    { id: "3", speaker: "B", start: 2, end: 3, text: "Hi." },
    { id: "4", speaker: "B", start: 8, end: 9, text: "Later." },
  ]);

  assert.deepEqual(turns, [
    { id: "1", speaker: "A", start: 0, end: 2, text: "Hello. Still me." },
    { id: "3", speaker: "B", start: 2, end: 3, text: "Hi." },
    { id: "4", speaker: "B", start: 8, end: 9, text: "Later." },
  ]);
});

test("accepts browser recording formats and builds stable download names", () => {
  assert.equal(
    isSupportedDiarizationAudio({
      name: "session.webm",
      type: "audio/webm;codecs=opus",
    }),
    true,
  );
  assert.equal(
    isSupportedDiarizationAudio({ name: "session.txt", type: "text/plain" }),
    false,
  );
  assert.equal(
    sessionAudioFilename("audio/mp4", new Date("2026-08-08T12:34:56.000Z")),
    "jiddu-session-2026-08-08T12-34-56-000Z.mp4",
  );
});

test("formats timestamps and keeps a one-hour target recording below 25 MB", () => {
  assert.equal(formatDiarizationTimestamp(65.9), "1:05");
  assert.equal(formatDiarizationTimestamp(3_665), "1:01:05");
  const oneHourBytes =
    (LOCAL_RECORDING_AUDIO_BITS_PER_SECOND * 60 * 60) / 8;
  assert.ok(oneHourBytes < MAX_DIARIZATION_AUDIO_BYTES);
});

test("round-trips a saved diarization and sanitizes speaker names", () => {
  const saved = createSavedDiarization(
    {
      text: "Hello there",
      duration: 3,
      segments: [
        { speaker: "A", start: 0, end: 3, text: "Hello there" },
      ],
    },
    { A: "  Rafael  ", B: "Not present" },
  );

  assert.ok(saved);
  assert.deepEqual(saved.speakerNames, { A: "Rafael" });
  assert.deepEqual(readSavedDiarization(JSON.stringify(saved)), saved);
  assert.equal(readSavedDiarization("not-json"), null);
});
