import { z } from "zod";
import {
  DEFAULT_LIVE_ANALYSIS_CONFIG,
  LiveAnalysisConfigSchema,
  LiveParticipantRoleSchema,
} from "./live-analysis-config";

export const LIVE_CONTEXT_TERM_KINDS = [
  "slang",
  "acronym",
  "jargon",
  "cultural_reference",
] as const;

export type LiveContextTermKind = (typeof LIVE_CONTEXT_TERM_KINDS)[number];

export const LIVE_CONTEXT_ENTITY_KINDS = [
  "person",
  "institution",
  "organization",
  "country",
  "city",
  "region",
  "place",
  "event",
] as const;

export type LiveContextEntityKind = (typeof LIVE_CONTEXT_ENTITY_KINDS)[number];

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

export const LiveContextWindowEntitySchema = z.object({
  name: z.string().trim().min(1),
  kind: z.enum(LIVE_CONTEXT_ENTITY_KINDS),
  description: z.string().trim().min(1),
  aliases: z.array(z.string().trim().min(1)).default([]),
  sentenceIds: z.array(z.string()).min(1),
  confidence: ConfidenceSchema,
  importance: ConfidenceSchema,
});

export const LiveContextWindowRelationSchema = z.object({
  sourceName: z.string().trim().min(1),
  targetName: z.string().trim().min(1),
  label: z.string().trim().min(1),
  description: z.string().trim().min(1),
  sentenceIds: z.array(z.string()).min(1),
  confidence: ConfidenceSchema,
  importance: ConfidenceSchema,
});

export const LiveContextWindowSchema = z.object({
  language: z.string().nullable().optional(),
  tags: z.array(LiveContextWindowTagSchema),
  topics: z.array(LiveContextWindowTopicSchema),
  terms: z.array(LiveContextWindowTermSchema),
  entities: z.array(LiveContextWindowEntitySchema).default([]),
  relations: z.array(LiveContextWindowRelationSchema).default([]),
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

export const LiveContextEntitySchema = LiveContextWindowEntitySchema.extend({
  id: z.string(),
  // Listener-configured participants exist before the first sentence.
  sentenceIds: z.array(z.string()),
  participantRole: LiveParticipantRoleSchema.optional(),
  userSupplied: z.boolean().optional(),
  placeholder: z.boolean().optional(),
  // Manual session-level corrections are authoritative over later model
  // windows, while remaining private to the analysis that produced them.
  userCorrectedName: z.boolean().optional(),
  userCorrectedAt: z.string().datetime().optional(),
  userCorrectedKind: z.boolean().optional(),
  userCorrectedKindAt: z.string().datetime().optional(),
});

export const LiveContextRelationSchema = z.object({
  id: z.string(),
  sourceEntityId: z.string(),
  targetEntityId: z.string(),
  label: z.string().trim().min(1),
  description: z.string().trim().min(1),
  sentenceIds: z.array(z.string()).min(1),
  confidence: ConfidenceSchema,
  importance: ConfidenceSchema,
});

export const LiveContextSchema = z.object({
  analysisConfig: LiveAnalysisConfigSchema.default(
    DEFAULT_LIVE_ANALYSIS_CONFIG,
  ),
  // `default` keeps recaps created before broad tags were introduced valid.
  tags: z.array(LiveContextTagSchema).default([]),
  relatedLinks: z.array(LiveRelatedLinkSchema).default([]),
  // Listener-dismissed names are private session state. Keeping a tombstone
  // prevents a later analysis window from recreating the same wrong card.
  dismissedEntityNames: z.array(z.string().trim().min(1)).max(100).default([]),
  topics: z.array(LiveContextTopicSchema),
  terms: z.array(LiveContextTermSchema),
  entities: z.array(LiveContextEntitySchema).default([]),
  relations: z.array(LiveContextRelationSchema).default([]),
  segments: z.array(LiveContextSegmentSchema),
  summary: z.string(),
});

export type LiveRelatedLink = z.infer<typeof LiveRelatedLinkSchema>;
export type LiveContextTag = z.infer<typeof LiveContextTagSchema>;
export type LiveContextTopic = z.infer<typeof LiveContextTopicSchema>;
export type LiveContextTerm = z.infer<typeof LiveContextTermSchema>;
export type LiveContextSegment = z.infer<typeof LiveContextSegmentSchema>;
export type LiveContextEntity = z.infer<typeof LiveContextEntitySchema>;
export type LiveContextRelation = z.infer<typeof LiveContextRelationSchema>;
export type LiveContext = z.infer<typeof LiveContextSchema>;

export const EMPTY_LIVE_CONTEXT: LiveContext = {
  analysisConfig: DEFAULT_LIVE_ANALYSIS_CONFIG,
  tags: [],
  relatedLinks: [],
  dismissedEntityNames: [],
  topics: [],
  terms: [],
  entities: [],
  relations: [],
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
  const dismissedEntityNames = [...current.dismissedEntityNames];
  const tags = current.tags.map(cloneTag);
  const topics = current.topics.map(cloneTopic);
  const terms = current.terms.map(cloneTerm);
  const entities = current.entities.map(cloneEntity);
  const relations = current.relations.map(cloneRelation);
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
      id: `tag${nextCounter(
        tags.map((tag) => tag.id),
        "tag",
      )}`,
      ...candidate,
      sentenceIds: [...candidate.sentenceIds],
    });
  }

  for (const candidate of window.topics.slice(0, 4)) {
    const key = normalizeLabel(candidate.label);
    const existing = topics.find(
      (topic) => normalizeLabel(topic.label) === key,
    );
    if (existing) {
      existing.sentenceIds = union(existing.sentenceIds, candidate.sentenceIds);
      if (candidate.confidence >= existing.confidence) {
        existing.label = candidate.label;
        existing.confidence = candidate.confidence;
      }
      continue;
    }
    topics.push({
      id: `topic${nextCounter(
        topics.map((topic) => topic.id),
        "topic",
      )}`,
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
      id: `term${nextCounter(
        terms.map((term) => term.id),
        "term",
      )}`,
      ...candidate,
      sentenceIds: [...candidate.sentenceIds],
    });
  }

  for (const candidate of window.entities.slice(0, 8)) {
    if (isDismissedEntityCandidate(candidate, dismissedEntityNames)) continue;
    const existing = findMatchingEntity(entities, candidate);
    if (existing) {
      existing.sentenceIds = union(existing.sentenceIds, candidate.sentenceIds);
      existing.aliases = unionLabels(
        existing.aliases,
        existing.userCorrectedName || existing.userSupplied
          ? [candidate.name, ...candidate.aliases]
          : candidate.aliases,
      );
      existing.importance = Math.max(existing.importance, candidate.importance);
      if (candidate.confidence >= existing.confidence) {
        if (!existing.userCorrectedName && !existing.userSupplied) {
          existing.name = candidate.name;
          existing.description = candidate.description;
        }
        if (!existing.userCorrectedKind) existing.kind = candidate.kind;
        existing.confidence = candidate.confidence;
      }
      continue;
    }
    entities.push({
      id: `entity${nextCounter(
        entities.map((entity) => entity.id),
        "entity",
      )}`,
      ...candidate,
      aliases: [...candidate.aliases],
      sentenceIds: [...candidate.sentenceIds],
    });
  }

  for (const candidate of window.relations.slice(0, 10)) {
    const source = findEntityByName(entities, candidate.sourceName);
    const target = findEntityByName(entities, candidate.targetName);
    if (!source || !target || source.id === target.id) continue;
    const relationKey = normalizeLabel(candidate.label);
    const existing = relations.find(
      (relation) =>
        relation.sourceEntityId === source.id &&
        relation.targetEntityId === target.id &&
        normalizeLabel(relation.label) === relationKey,
    );
    if (existing) {
      existing.sentenceIds = union(existing.sentenceIds, candidate.sentenceIds);
      existing.importance = Math.max(existing.importance, candidate.importance);
      if (candidate.confidence >= existing.confidence) {
        existing.label = candidate.label;
        existing.description = candidate.description;
        existing.confidence = candidate.confidence;
      }
      continue;
    }
    relations.push({
      id: `relation${nextCounter(
        relations.map((relation) => relation.id),
        "relation",
      )}`,
      sourceEntityId: source.id,
      targetEntityId: target.id,
      label: candidate.label,
      description: candidate.description,
      sentenceIds: [...candidate.sentenceIds],
      confidence: candidate.confidence,
      importance: candidate.importance,
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
    analysisConfig: current.analysisConfig,
    relatedLinks,
    dismissedEntityNames,
    tags,
    topics,
    terms,
    entities,
    relations,
    segments,
    summary: window.summary.trim() || current.summary,
  };
}

function isDismissedEntityCandidate(
  candidate: z.infer<typeof LiveContextWindowEntitySchema>,
  dismissedEntityNames: string[],
): boolean {
  const dismissed = new Set(dismissedEntityNames.map(normalizeLabel));
  return [candidate.name, ...candidate.aliases]
    .map(normalizeLabel)
    .some((name) => dismissed.has(name));
}

export function sanitizeLiveContextWindow(
  value: LiveContextWindow,
  allowedSentenceIds: ReadonlySet<string>,
): LiveContextWindow | null {
  const anchored = (ids: string[]) =>
    ids.length > 0 && ids.every((id) => allowedSentenceIds.has(id));
  if (!anchored(value.segment.sentenceIds)) return null;

  const entities = value.entities
    .filter(
      (entity) => entity.confidence >= 0.72 && anchored(entity.sentenceIds),
    )
    .map(refineGeographicEntityKind);
  const windowEntityNames = new Set(
    entities.flatMap((entity) =>
      [entity.name, ...entity.aliases].map(normalizeLabel),
    ),
  );

  return {
    ...value,
    tags: value.tags.filter(
      (tag) => tag.confidence >= 0.65 && anchored(tag.sentenceIds),
    ),
    topics: value.topics.filter((topic) => anchored(topic.sentenceIds)),
    terms: value.terms.filter(
      (term) => term.confidence >= 0.72 && anchored(term.sentenceIds),
    ),
    entities,
    relations: value.relations.filter(
      (relation) =>
        relation.confidence >= 0.74 &&
        anchored(relation.sentenceIds) &&
        windowEntityNames.has(normalizeLabel(relation.sourceName)) &&
        windowEntityNames.has(normalizeLabel(relation.targetName)),
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

function unionLabels(left: string[], right: string[]): string[] {
  const result = [...left];
  const keys = new Set(left.map(normalizeLabel));
  for (const value of right) {
    const key = normalizeLabel(value);
    if (!key || keys.has(key)) continue;
    keys.add(key);
    result.push(value);
  }
  return result;
}

function findMatchingEntity(
  entities: LiveContextEntity[],
  candidate: z.infer<typeof LiveContextWindowEntitySchema>,
): LiveContextEntity | undefined {
  const candidateNames = new Set(
    [candidate.name, ...candidate.aliases].map(normalizeLabel).filter(Boolean),
  );
  const nameMatches = (entity: LiveContextEntity) =>
    [entity.name, ...entity.aliases]
      .map(normalizeLabel)
      .some((name) => candidateNames.has(name));
  return (
    entities.find((entity) => entity.userCorrectedKind && nameMatches(entity)) ??
    entities.find(
      (entity) => entity.kind === candidate.kind && nameMatches(entity),
    )
  );
}

function refineGeographicEntityKind(
  entity: z.infer<typeof LiveContextWindowEntitySchema>,
): z.infer<typeof LiveContextWindowEntitySchema> {
  if (
    !["country", "city", "region", "place", "event"].includes(entity.kind)
  ) {
    return entity;
  }
  const description = normalizeLabel(entity.description);
  let kind: LiveContextEntityKind | null = null;
  if (
    /^(cidade|municipio|capital|city|municipality|town|ciudad)\b/.test(
      description,
    )
  ) {
    kind = "city";
  } else if (
    /^(regiao|estado|provincia|territorio|region|state|province|territory|localizacao regional|ubicacion regional)\b/.test(
      description,
    )
  ) {
    kind = "region";
  } else if (/^(pais|nacao|country|nation)\b/.test(description)) {
    kind = "country";
  } else if (/^(local|localizacao|lugar|location|place|site)\b/.test(description)) {
    kind = "place";
  }
  return kind && kind !== entity.kind ? { ...entity, kind } : entity;
}

function findEntityByName(
  entities: LiveContextEntity[],
  name: string,
): LiveContextEntity | undefined {
  const key = normalizeLabel(name);
  return entities.find((entity) =>
    [entity.name, ...entity.aliases].map(normalizeLabel).includes(key),
  );
}

function nextCounter(ids: string[], prefix: string): number {
  return (
    ids.reduce((highest, id) => {
      const match = new RegExp(`^${prefix}(\\d+)$`).exec(id);
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0) + 1
  );
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

function cloneEntity(entity: LiveContextEntity): LiveContextEntity {
  return {
    ...entity,
    aliases: [...entity.aliases],
    sentenceIds: [...entity.sentenceIds],
  };
}

function cloneRelation(relation: LiveContextRelation): LiveContextRelation {
  return { ...relation, sentenceIds: [...relation.sentenceIds] };
}
