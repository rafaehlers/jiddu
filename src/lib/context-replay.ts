import { ClaimSchema } from "./claims-schema";
import type { ContextReplayEvent } from "./context-replay-schema";
import {
  EMPTY_LIVE_CONTEXT,
  LiveContextSchema,
  type LiveContext,
} from "./live-context-schema";
import type {
  LiveClaim,
  LiveNeutralityVerdict,
} from "./live/use-live-analysis";
import {
  NEUTRALITY_VERDICTS,
  NeutralityFindingSchema,
  type NeutralityFinding,
} from "./neutrality-schema";
import { FindingSchema, type Finding, type Sentence } from "./schema";
import type { Verdict } from "./verdict-schema";

const DEFAULT_WORDS_PER_MINUTE = 150;
const MIN_REPLAY_DURATION_MS = 10_000;

export type ContextReplaySource = {
  transcript: string;
  sentences: Sentence[];
  audioDurationMs: number | null;
  context: LiveContext;
  findings: Finding[];
  claims: LiveClaim[];
  verdicts: Verdict[];
  neutralityFindings: NeutralityFinding[];
  neutralityVerdict: LiveNeutralityVerdict | null;
  events: ContextReplayEvent[];
};

export type ContextReplayFrame = {
  durationMs: number;
  playheadMs: number;
  exact: boolean;
  atEnd: boolean;
  transcript: string;
  context: LiveContext;
  findings: Finding[];
  claims: LiveClaim[];
  verdicts: Verdict[];
  neutralityFindings: NeutralityFinding[];
  neutralityVerdict: LiveNeutralityVerdict | null;
};

export function resolveContextReplayDuration(
  source: Pick<
    ContextReplaySource,
    "transcript" | "audioDurationMs" | "events"
  >,
): number {
  const eventDuration = source.events.reduce(
    (maximum, event) => Math.max(maximum, event.elapsedMs),
    0,
  );
  const words = source.transcript.trim()
    ? source.transcript.trim().split(/\s+/).length
    : 0;
  const estimatedDuration = Math.max(
    MIN_REPLAY_DURATION_MS,
    Math.round((words / DEFAULT_WORDS_PER_MINUTE) * 60_000),
  );
  return Math.max(
    source.audioDurationMs ?? 0,
    eventDuration,
    estimatedDuration,
  );
}

export function buildContextReplayFrame(
  source: ContextReplaySource,
  requestedPlayheadMs: number,
): ContextReplayFrame {
  const durationMs = resolveContextReplayDuration(source);
  const playheadMs = clamp(requestedPlayheadMs, 0, durationMs);
  const atEnd = playheadMs >= durationMs;
  const exact = source.events.some(
    (event) => event.kind === "transcript_delta",
  );

  if (atEnd) {
    return {
      durationMs,
      playheadMs: durationMs,
      exact,
      atEnd: true,
      transcript: source.transcript,
      context: source.context,
      findings: source.findings,
      claims: source.claims,
      verdicts: source.verdicts,
      neutralityFindings: source.neutralityFindings,
      neutralityVerdict: source.neutralityVerdict,
    };
  }

  const visibleEvents = source.events.filter(
    (event) => event.elapsedMs <= playheadMs,
  );
  const sentenceTimes = buildSentenceTimes(
    source.sentences,
    source.transcript.length,
    durationMs,
  );
  const isVisible = (sentenceIds: string[]) =>
    sentenceIds.length > 0 &&
    sentenceIds.every(
      (sentenceId) =>
        (sentenceTimes.get(sentenceId) ?? durationMs) <= playheadMs,
    );

  return {
    durationMs,
    playheadMs,
    exact,
    atEnd: false,
    transcript:
      transcriptFromEvents(visibleEvents) ??
      visibleTranscript(
        source.transcript,
        source.sentences,
        playheadMs,
        durationMs,
      ),
    context:
      latestContextSnapshot(visibleEvents) ??
      filterContext(source.context, isVisible),
    findings: eventItems(
      source.events,
      visibleEvents,
      "finding_detected",
      FindingSchema,
      source.findings,
      isVisible,
      findingKey,
    ),
    claims: eventItems(
      source.events,
      visibleEvents,
      "claim_detected",
      ClaimSchema,
      source.claims,
      isVisible,
      (claim) => claim.id,
    ),
    verdicts: visibleVerdicts(source.events, visibleEvents),
    neutralityFindings: eventItems(
      source.events,
      visibleEvents,
      "neutrality_finding_detected",
      NeutralityFindingSchema,
      source.neutralityFindings,
      isVisible,
      neutralityFindingKey,
    ),
    neutralityVerdict: latestNeutralityVerdict(visibleEvents),
  };
}

function transcriptFromEvents(events: ContextReplayEvent[]): string | null {
  const deltas = events.filter((event) => event.kind === "transcript_delta");
  if (deltas.length === 0) return null;
  return deltas
    .map((event) => {
      const delta = (event.payload as { delta?: unknown } | null)?.delta;
      return typeof delta === "string" ? delta : "";
    })
    .join("");
}

function visibleTranscript(
  transcript: string,
  sentences: Sentence[],
  playheadMs: number,
  durationMs: number,
): string {
  if (!transcript || playheadMs <= 0) return "";
  if (sentences.length === 0) {
    return transcript.slice(
      0,
      Math.floor((playheadMs / durationMs) * transcript.length),
    );
  }
  const characterCutoff = Math.floor(
    (playheadMs / durationMs) * transcript.length,
  );
  const completed = sentences.filter(
    (sentence) => sentence.end <= characterCutoff,
  );
  const lastEnd = completed.at(-1)?.end ?? characterCutoff;
  return transcript.slice(0, Math.max(0, lastEnd));
}

function buildSentenceTimes(
  sentences: Sentence[],
  transcriptLength: number,
  durationMs: number,
): Map<string, number> {
  const divisor = Math.max(1, transcriptLength);
  return new Map(
    sentences.map((sentence) => [
      sentence.id,
      clamp(Math.round((sentence.end / divisor) * durationMs), 0, durationMs),
    ]),
  );
}

function latestContextSnapshot(
  events: ContextReplayEvent[],
): LiveContext | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.kind !== "context_snapshot") continue;
    const parsed = LiveContextSchema.safeParse(event.payload);
    if (parsed.success) return parsed.data;
  }
  return null;
}

function filterContext(
  context: LiveContext,
  isVisible: (sentenceIds: string[]) => boolean,
): LiveContext {
  const entities = context.entities.filter((entity) =>
    isVisible(entity.sentenceIds),
  );
  const visibleEntityIds = new Set(entities.map((entity) => entity.id));
  return {
    tags: context.tags.filter((tag) => isVisible(tag.sentenceIds)),
    relatedLinks: [],
    dismissedEntityNames: [],
    topics: context.topics.filter((topic) => isVisible(topic.sentenceIds)),
    terms: context.terms.filter((term) => isVisible(term.sentenceIds)),
    entities,
    relations: context.relations.filter(
      (relation) =>
        isVisible(relation.sentenceIds) &&
        visibleEntityIds.has(relation.sourceEntityId) &&
        visibleEntityIds.has(relation.targetEntityId),
    ),
    segments: context.segments.filter((segment) =>
      isVisible(segment.sentenceIds),
    ),
    summary: "",
  };
}

function eventItems<T extends { sentenceIds: string[] }>(
  allEvents: ContextReplayEvent[],
  visibleEvents: ContextReplayEvent[],
  kind: ContextReplayEvent["kind"],
  schema: { safeParse: (value: unknown) => { success: boolean; data?: unknown } },
  fallback: T[],
  isVisible: (sentenceIds: string[]) => boolean,
  key: (item: T) => string,
): T[] {
  const hasKind = allEvents.some((event) => event.kind === kind);
  if (!hasKind) return fallback.filter((item) => isVisible(item.sentenceIds));
  const result = new Map<string, T>();
  for (const event of visibleEvents) {
    if (event.kind !== kind) continue;
    const parsed = schema.safeParse(event.payload);
    if (!parsed.success) continue;
    let item = parsed.data as T;
    // ClaimSchema intentionally excludes the local id, so preserve it from
    // the private event payload after validating the claim fields.
    if (
      kind === "claim_detected" &&
      typeof (event.payload as { id?: unknown })?.id !== "string"
    ) {
      continue;
    }
    if (kind === "claim_detected") {
      item = {
        ...(parsed.data as object),
        id: (event.payload as { id: string }).id,
      } as unknown as T;
    }
    result.set(key(item), item);
  }
  return [...result.values()];
}

function visibleVerdicts(
  allEvents: ContextReplayEvent[],
  visibleEvents: ContextReplayEvent[],
): Verdict[] {
  if (!allEvents.some((event) => event.kind === "claim_verified")) return [];
  const result = new Map<string, Verdict>();
  for (const event of visibleEvents) {
    if (event.kind !== "claim_verified") continue;
    const verdict = parseVerdict(event.payload);
    if (verdict) result.set(verdict.claimId, verdict);
  }
  return [...result.values()];
}

function parseVerdict(payload: unknown): Verdict | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as Partial<Verdict>;
  if (
    typeof value.claimId !== "string" ||
    !["supported", "contradicted", "mixed", "unverified"].includes(
      value.verdict ?? "",
    ) ||
    typeof value.confidence !== "number" ||
    typeof value.rationale !== "string" ||
    !Array.isArray(value.sources) ||
    typeof value.model !== "string"
  ) {
    return null;
  }
  return value as Verdict;
}

function latestNeutralityVerdict(
  events: ContextReplayEvent[],
): LiveNeutralityVerdict | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.kind !== "neutrality_assessed") continue;
    if (!event.payload || typeof event.payload !== "object") continue;
    const value = event.payload as Partial<LiveNeutralityVerdict>;
    if (
      !NEUTRALITY_VERDICTS.includes(
        value.verdict as (typeof NEUTRALITY_VERDICTS)[number],
      ) ||
      typeof value.confidence !== "number" ||
      typeof value.rationale !== "string"
    ) {
      continue;
    }
    return value as LiveNeutralityVerdict;
  }
  return null;
}

function findingKey(finding: Finding): string {
  return `${finding.sentenceIds.join(",")}::${finding.fallacy}`;
}

function neutralityFindingKey(finding: NeutralityFinding): string {
  return `${finding.sentenceIds.join(",")}::${finding.issue}`;
}

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

export const EMPTY_CONTEXT_REPLAY_FRAME: ContextReplayFrame = {
  durationMs: MIN_REPLAY_DURATION_MS,
  playheadMs: 0,
  exact: false,
  atEnd: false,
  transcript: "",
  context: EMPTY_LIVE_CONTEXT,
  findings: [],
  claims: [],
  verdicts: [],
  neutralityFindings: [],
  neutralityVerdict: null,
};
