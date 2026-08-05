import { z } from "zod";

export const LIVE_CONTEXT_TERM_KINDS = [
  "slang",
  "acronym",
  "jargon",
  "cultural_reference",
] as const;

export type LiveContextTermKind = (typeof LIVE_CONTEXT_TERM_KINDS)[number];

const ConfidenceSchema = z.number().min(0).max(1);
const HttpUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol;
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  });

export const LiveRelatedLinkSchema = z.object({
  title: z.string().trim().min(1),
  url: HttpUrlSchema,
  source: z.string().trim().min(1),
});

export const LiveContextWindowTopicSchema = z.object({
  label: z.string().trim().min(1),
  sentenceIds: z.array(z.string()).min(1),
  confidence: ConfidenceSchema,
});

export const LiveContextWindowTagSchema = z.object({
  label: z.string().trim().min(1),
  sentenceIds: z.array(z.string()).min(1),
  confidence: ConfidenceSchema,
});

export const LiveContextWindowTermSchema = z.object({
  term: z.string().trim().min(1),
  kind: z.enum(LIVE_CONTEXT_TERM_KINDS),
  explanation: z.string().trim().min(1),
  sentenceIds: z.array(z.string()).min(1),
  confidence: ConfidenceSchema,
});

export const LiveContextWindowSegmentSchema = z.object({
  title: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  sentenceIds: z.array(z.string()).min(1),
});

export const LiveContextWindowSchema = z.object({
  language: z.string().nullable().optional(),
  tags: z.array(LiveContextWindowTagSchema),
  topics: z.array(LiveContextWindowTopicSchema),
  terms: z.array(LiveContextWindowTermSchema),
  segment: LiveContextWindowSegmentSchema,
  summary: z.string(),
});

export type LiveContextWindow = z.infer<typeof LiveContextWindowSchema>;

export const LiveContextTopicSchema = LiveContextWindowTopicSchema.extend({
  id: z.string(),
});

export const LiveContextTagSchema = LiveContextWindowTagSchema.extend({
  id: z.string(),
});

export const LiveContextTermSchema = LiveContextWindowTermSchema.extend({
  id: z.string(),
});

export const LiveContextSegmentSchema = LiveContextWindowSegmentSchema.extend({
  id: z.string(),
});

export const LiveContextSchema = z.object({
  // `default` keeps recaps created before broad tags were introduced valid.
  tags: z.array(LiveContextTagSchema).default([]),
  relatedLinks: z.array(LiveRelatedLinkSchema).default([]),
  topics: z.array(LiveContextTopicSchema),
  terms: z.array(LiveContextTermSchema),
  segments: z.array(LiveContextSegmentSchema),
  summary: z.string(),
});

export type LiveRelatedLink = z.infer<typeof LiveRelatedLinkSchema>;
export type LiveContextTag = z.infer<typeof LiveContextTagSchema>;
export type LiveContextTopic = z.infer<typeof LiveContextTopicSchema>;
export type LiveContextTerm = z.infer<typeof LiveContextTermSchema>;
export type LiveContextSegment = z.infer<typeof LiveContextSegmentSchema>;
export type LiveContext = z.infer<typeof LiveContextSchema>;

export const EMPTY_LIVE_CONTEXT: LiveContext = {
  tags: [],
  relatedLinks: [],
  topics: [],
  terms: [],
  segments: [],
  summary: "",
};

export function readLiveContext(value: unknown): LiveContext {
  if (typeof value !== "string" || !value.trim()) {
    return { ...EMPTY_LIVE_CONTEXT };
  }
  try {
    const parsed = LiveContextSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : { ...EMPTY_LIVE_CONTEXT };
  } catch {
    return { ...EMPTY_LIVE_CONTEXT };
  }
}

export function mergeLiveContext(
  current: LiveContext,
  window: LiveContextWindow,
): LiveContext {
  const relatedLinks = current.relatedLinks.map((link) => ({ ...link }));
  const tags = current.tags.map(cloneTag);
  const topics = current.topics.map(cloneTopic);
  const terms = current.terms.map(cloneTerm);
  const segments = current.segments.map(cloneSegment);

  for (const candidate of window.tags.slice(0, 6)) {
    const key = normalizeLabel(candidate.label);
    const existing = tags.find((tag) => normalizeLabel(tag.label) === key);
    if (existing) {
      existing.sentenceIds = union(existing.sentenceIds, candidate.sentenceIds);
      if (candidate.confidence >= existing.confidence) {
        existing.label = candidate.label;
        existing.confidence = candidate.confidence;
      }
      continue;
    }
    tags.push({
      id: `tag${nextCounter(tags.map((tag) => tag.id), "tag")}`,
      ...candidate,
      sentenceIds: [...candidate.sentenceIds],
    });
  }

  for (const candidate of window.topics.slice(0, 4)) {
    const key = normalizeLabel(candidate.label);
    const existing = topics.find((topic) => normalizeLabel(topic.label) === key);
    if (existing) {
      existing.sentenceIds = union(existing.sentenceIds, candidate.sentenceIds);
      if (candidate.confidence >= existing.confidence) {
        existing.label = candidate.label;
        existing.confidence = candidate.confidence;
      }
      continue;
    }
    topics.push({
      id: `topic${nextCounter(topics.map((topic) => topic.id), "topic")}`,
      ...candidate,
      sentenceIds: [...candidate.sentenceIds],
    });
  }

  for (const candidate of window.terms.slice(0, 4)) {
    const key = normalizeLabel(candidate.term);
    const existing = terms.find((term) => normalizeLabel(term.term) === key);
    if (existing) {
      existing.sentenceIds = union(existing.sentenceIds, candidate.sentenceIds);
      if (candidate.confidence >= existing.confidence) {
        existing.term = candidate.term;
        existing.kind = candidate.kind;
        existing.explanation = candidate.explanation;
        existing.confidence = candidate.confidence;
      }
      continue;
    }
    terms.push({
      id: `term${nextCounter(terms.map((term) => term.id), "term")}`,
      ...candidate,
      sentenceIds: [...candidate.sentenceIds],
    });
  }

  const lastSegment = segments.at(-1);
  if (
    lastSegment &&
    normalizeLabel(lastSegment.title) === normalizeLabel(window.segment.title)
  ) {
    lastSegment.sentenceIds = union(
      lastSegment.sentenceIds,
      window.segment.sentenceIds,
    );
    lastSegment.summary = mergeSummary(
      lastSegment.summary,
      window.segment.summary,
    );
  } else {
    segments.push({
      id: `segment${nextCounter(
        segments.map((segment) => segment.id),
        "segment",
      )}`,
      ...window.segment,
      sentenceIds: [...window.segment.sentenceIds],
    });
  }

  return {
    relatedLinks,
    tags,
    topics,
    terms,
    segments,
    summary: window.summary.trim() || current.summary,
  };
}

export function sanitizeLiveContextWindow(
  value: LiveContextWindow,
  allowedSentenceIds: ReadonlySet<string>,
): LiveContextWindow | null {
  const anchored = (ids: string[]) =>
    ids.length > 0 && ids.every((id) => allowedSentenceIds.has(id));
  if (!anchored(value.segment.sentenceIds)) return null;

  return {
    ...value,
    tags: value.tags.filter(
      (tag) => tag.confidence >= 0.65 && anchored(tag.sentenceIds),
    ),
    topics: value.topics.filter((topic) => anchored(topic.sentenceIds)),
    terms: value.terms.filter(
      (term) => term.confidence >= 0.72 && anchored(term.sentenceIds),
    ),
  };
}

function normalizeLabel(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function union(left: string[], right: string[]): string[] {
  return [...new Set([...left, ...right])];
}

function nextCounter(ids: string[], prefix: string): number {
  return ids.reduce((highest, id) => {
    const match = new RegExp(`^${prefix}(\\d+)$`).exec(id);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0) + 1;
}

function mergeSummary(previous: string, next: string): string {
  const a = previous.trim();
  const b = next.trim();
  if (!a) return b;
  if (!b || normalizeLabel(a) === normalizeLabel(b)) return a;
  return `${a} ${b}`.slice(0, 800);
}

function cloneTag(tag: LiveContextTag): LiveContextTag {
  return { ...tag, sentenceIds: [...tag.sentenceIds] };
}

function cloneTopic(topic: LiveContextTopic): LiveContextTopic {
  return { ...topic, sentenceIds: [...topic.sentenceIds] };
}

function cloneTerm(term: LiveContextTerm): LiveContextTerm {
  return { ...term, sentenceIds: [...term.sentenceIds] };
}

function cloneSegment(segment: LiveContextSegment): LiveContextSegment {
  return { ...segment, sentenceIds: [...segment.sentenceIds] };
}
