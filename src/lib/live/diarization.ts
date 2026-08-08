export const MAX_DIARIZATION_AUDIO_BYTES = 25_000_000;
export const LOCAL_RECORDING_AUDIO_BITS_PER_SECOND = 48_000;

const MAX_SEGMENTS = 10_000;
const MAX_SEGMENT_TEXT_CHARS = 20_000;
const MAX_SPEAKER_CHARS = 100;
const MAX_SPEAKER_NAME_CHARS = 100;

const SUPPORTED_EXTENSIONS = new Set([
  "m4a",
  "mp3",
  "mp4",
  "mpeg",
  "mpga",
  "wav",
  "webm",
]);

const SUPPORTED_MIME_TYPES = new Set([
  "audio/m4a",
  "audio/mp3",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/webm",
  "audio/x-m4a",
  "audio/x-wav",
  "video/mp4",
  "video/webm",
]);

export type DiarizedSegment = {
  id: string;
  speaker: string;
  start: number;
  end: number;
  text: string;
};

export type DiarizationResult = {
  text: string;
  duration: number | null;
  segments: DiarizedSegment[];
};

export type DiarizedSpeakerTurn = {
  id: string;
  speaker: string;
  start: number;
  end: number;
  text: string;
};

export type SavedDiarization = {
  version: 1;
  result: DiarizationResult;
  speakerNames: Record<string, string>;
};

export function sanitizeDiarizationResult(
  value: unknown,
): DiarizationResult | null {
  if (!isRecord(value) || !Array.isArray(value.segments)) return null;

  const segments: DiarizedSegment[] = [];
  for (const [index, candidate] of value.segments
    .slice(0, MAX_SEGMENTS)
    .entries()) {
    if (!isRecord(candidate)) continue;
    const speaker = normalizeText(candidate.speaker, MAX_SPEAKER_CHARS);
    const text = normalizeText(candidate.text, MAX_SEGMENT_TEXT_CHARS);
    const start = normalizeTime(candidate.start);
    const end = normalizeTime(candidate.end);
    if (!speaker || !text || start === null || end === null || end < start) {
      continue;
    }
    segments.push({
      id: normalizeText(candidate.id, 200) ?? `segment-${index + 1}`,
      speaker,
      start,
      end,
      text,
    });
  }

  if (segments.length === 0) return null;
  const usage = isRecord(value.usage) ? value.usage : null;
  return {
    text:
      normalizeText(value.text, 1_000_000) ??
      segments.map((segment) => segment.text).join(" "),
    duration: normalizeTime(value.duration) ?? normalizeTime(usage?.seconds),
    segments,
  };
}

export function groupDiarizedSegments(
  segments: readonly DiarizedSegment[],
): DiarizedSpeakerTurn[] {
  const turns: DiarizedSpeakerTurn[] = [];
  for (const segment of segments) {
    const previous = turns.at(-1);
    if (
      previous &&
      previous.speaker === segment.speaker &&
      segment.start - previous.end <= 2
    ) {
      previous.end = Math.max(previous.end, segment.end);
      previous.text = `${previous.text} ${segment.text}`.trim();
      continue;
    }
    turns.push({ ...segment });
  }
  return turns;
}

export function createSavedDiarization(
  resultValue: unknown,
  speakerNamesValue: unknown,
): SavedDiarization | null {
  const result = sanitizeDiarizationResult(resultValue);
  if (!result) return null;

  const speakers = new Set(result.segments.map((segment) => segment.speaker));
  const speakerNameEntries: Array<[string, string]> = [];
  if (isRecord(speakerNamesValue)) {
    for (const speaker of speakers) {
      const name = normalizeText(
        speakerNamesValue[speaker],
        MAX_SPEAKER_NAME_CHARS,
      );
      if (name) speakerNameEntries.push([speaker, name]);
    }
  }

  return {
    version: 1,
    result,
    speakerNames: Object.fromEntries(speakerNameEntries),
  };
}

export function readSavedDiarization(
  raw: string | null | undefined,
): SavedDiarization | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || parsed.version !== 1) return null;
    return createSavedDiarization(parsed.result, parsed.speakerNames);
  } catch {
    return null;
  }
}

export function isSupportedDiarizationAudio(file: {
  name: string;
  type: string;
}): boolean {
  const mimeType = file.type.toLowerCase().split(";", 1)[0]?.trim() ?? "";
  const extension = file.name.toLowerCase().split(".").at(-1) ?? "";
  return (
    SUPPORTED_MIME_TYPES.has(mimeType) || SUPPORTED_EXTENSIONS.has(extension)
  );
}

export function audioExtensionForMimeType(mimeType: string): "mp4" | "webm" {
  return mimeType.toLowerCase().includes("mp4") ? "mp4" : "webm";
}

export function sessionAudioFilename(
  mimeType: string,
  now = new Date(),
): string {
  const timestamp = now.toISOString().replace(/[:.]/g, "-");
  return `jiddu-session-${timestamp}.${audioExtensionForMimeType(mimeType)}`;
}

export function formatDiarizationTimestamp(seconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const remainder = totalSeconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function normalizeText(value: unknown, maxChars: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().slice(0, maxChars);
  return normalized || null;
}

function normalizeTime(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
