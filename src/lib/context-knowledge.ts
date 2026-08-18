import "server-only";

import type { Lang } from "./fallacies";
import type {
  KnowledgeEntityDTO,
  KnowledgeRelationDTO,
  KnowledgeSourceDTO,
} from "./context-knowledge-schema";
import type {
  LiveContext,
  LiveContextEntity,
  LiveContextRelation,
} from "./live-context-schema";
import { prisma } from "./db";
import { findWikipediaProfile } from "./wikipedia-profile";
import {
  isPublicProfileCompatible,
  type EntityProfileHint,
} from "./context-profile-match";
import type { ContextNewsResult } from "./llm/context-news";
import {
  knowledgeCanonicalKey,
  normalizeKnowledgeName,
} from "./context-knowledge-cache";

const DAY_MS = 24 * 60 * 60 * 1_000;
const PROFILE_TTL_MS = 21 * DAY_MS;
const NOT_FOUND_TTL_MS = DAY_MS;
export const CONTEXT_NEWS_TTL_MS = 8 * 60 * 60 * 1_000;
const RELATED_COVERAGE_LABEL = "Related coverage";
const RELATED_COVERAGE_KEY = "related coverage";

export async function assertOwnedContextSession(
  sessionId: string,
  ownerWorkosUserId: string,
) {
  return prisma.analysis.findFirst({
    where: {
      id: sessionId,
      ownerWorkosUserId,
      source: "live",
    },
    select: {
      id: true,
      ownerWorkosUserId: true,
      liveContext: true,
      sourceRef: true,
    },
  });
}

export async function upsertKnowledgeEntityFromLive(entity: LiveContextEntity) {
  const names = uniqueNames([entity.name, ...entity.aliases]);
  const normalizedNames = names.map(normalizeKnowledgeName).filter(Boolean);
  const canonicalKeys = normalizedNames.map((name) => `${entity.kind}:${name}`);
  const primaryName = normalizeKnowledgeName(entity.name);
  let row = await prisma.knowledgeEntity.findFirst({
    where: {
      type: entity.kind,
      OR: [
        { canonicalKey: knowledgeCanonicalKey(entity.kind, entity.name) },
        { aliases: { some: { normalizedName: primaryName } } },
      ],
    },
  });

  // A listener correction should not be silently mapped back to the
  // misspelled candidate through its old transcription alias. Uncorrected
  // model output can still use every alias for normal deduplication.
  if (!row && !entity.userCorrectedName) {
    row = await prisma.knowledgeEntity.findFirst({
      where: {
        type: entity.kind,
        OR: [
          { canonicalKey: { in: canonicalKeys } },
          { aliases: { some: { normalizedName: { in: normalizedNames } } } },
        ],
      },
    });
  }

  if (!row) {
    row = await prisma.knowledgeEntity.upsert({
      where: { canonicalKey: knowledgeCanonicalKey(entity.kind, entity.name) },
      update: {},
      create: {
        canonicalKey: knowledgeCanonicalKey(entity.kind, entity.name),
        canonicalName: entity.name,
        type: entity.kind,
      },
    });
  }

  return row;
}

export async function syncContextKnowledgeMentions(input: {
  analysisId: string;
  ownerWorkosUserId: string;
  context: LiveContext;
}): Promise<void> {
  const entityIds = new Map<string, string>();
  for (const entity of input.context.entities) {
    if (entity.placeholder) continue;
    const stored = await upsertKnowledgeEntityFromLive(entity);
    entityIds.set(entity.id, stored.id);
    await upsertKnowledgeEntityMention({
      analysisId: input.analysisId,
      ownerWorkosUserId: input.ownerWorkosUserId,
      storedEntityId: stored.id,
      entity,
    });
  }

  for (const relation of input.context.relations) {
    const sourceEntityId = entityIds.get(relation.sourceEntityId);
    const targetEntityId = entityIds.get(relation.targetEntityId);
    if (!sourceEntityId || !targetEntityId) continue;
    await upsertKnowledgeRelationMention({
      analysisId: input.analysisId,
      ownerWorkosUserId: input.ownerWorkosUserId,
      sourceEntityId,
      targetEntityId,
      sourceLocalEntityId: relation.sourceEntityId,
      targetLocalEntityId: relation.targetEntityId,
      relation,
    });
  }
}

export async function upsertKnowledgeRelationMention(input: {
  analysisId: string;
  ownerWorkosUserId: string;
  sourceEntityId: string;
  targetEntityId: string;
  sourceLocalEntityId: string;
  targetLocalEntityId: string;
  relation: LiveContextRelation;
}): Promise<void> {
  const normalizedLabel = normalizeKnowledgeName(input.relation.label);
  const publicRelation = await prisma.knowledgeRelation.findUnique({
    where: {
      sourceEntityId_targetEntityId_normalizedLabel: {
        sourceEntityId: input.sourceEntityId,
        targetEntityId: input.targetEntityId,
        normalizedLabel: RELATED_COVERAGE_KEY,
      },
    },
    select: { id: true },
  });
  await prisma.knowledgeRelationMention.upsert({
    where: {
      analysisId_sourceEntityId_targetEntityId_normalizedLabel: {
        analysisId: input.analysisId,
        sourceEntityId: input.sourceEntityId,
        targetEntityId: input.targetEntityId,
        normalizedLabel,
      },
    },
    update: {
      relationId: publicRelation?.id ?? undefined,
      sourceLocalEntityId: input.sourceLocalEntityId,
      targetLocalEntityId: input.targetLocalEntityId,
      localRelationId: input.relation.id,
      label: input.relation.label,
      description: input.relation.description,
      sentenceIds: JSON.stringify(input.relation.sentenceIds),
      confidence: input.relation.confidence,
      importance: input.relation.importance,
    },
    create: {
      analysisId: input.analysisId,
      ownerWorkosUserId: input.ownerWorkosUserId,
      relationId: publicRelation?.id,
      sourceEntityId: input.sourceEntityId,
      targetEntityId: input.targetEntityId,
      sourceLocalEntityId: input.sourceLocalEntityId,
      targetLocalEntityId: input.targetLocalEntityId,
      localRelationId: input.relation.id,
      label: input.relation.label,
      description: input.relation.description,
      normalizedLabel,
      sentenceIds: JSON.stringify(input.relation.sentenceIds),
      confidence: input.relation.confidence,
      importance: input.relation.importance,
    },
  });
}

export async function upsertKnowledgeEntityMention(input: {
  analysisId: string;
  ownerWorkosUserId: string;
  storedEntityId: string;
  entity: LiveContextEntity;
}): Promise<void> {
  await prisma.knowledgeEntityMention.upsert({
    where: {
      analysisId_entityId: {
        analysisId: input.analysisId,
        entityId: input.storedEntityId,
      },
    },
    update: {
      localEntityId: input.entity.id,
      name: input.entity.name,
      kind: input.entity.kind,
      description: input.entity.description,
      aliases: JSON.stringify(input.entity.aliases),
      sentenceIds: JSON.stringify(input.entity.sentenceIds),
      confidence: input.entity.confidence,
      importance: input.entity.importance,
    },
    create: {
      analysisId: input.analysisId,
      ownerWorkosUserId: input.ownerWorkosUserId,
      entityId: input.storedEntityId,
      localEntityId: input.entity.id,
      name: input.entity.name,
      kind: input.entity.kind,
      description: input.entity.description,
      aliases: JSON.stringify(input.entity.aliases),
      sentenceIds: JSON.stringify(input.entity.sentenceIds),
      confidence: input.entity.confidence,
      importance: input.entity.importance,
    },
  });
}

export async function getKnowledgeEntityDTO(
  entityId: string,
): Promise<KnowledgeEntityDTO | null> {
  const row = await prisma.knowledgeEntity.findUnique({
    where: { id: entityId },
    include: {
      aliases: { orderBy: { createdAt: "asc" } },
      sources: {
        orderBy: { discoveredAt: "desc" },
        take: 2,
        include: { source: true },
      },
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    canonicalName: row.canonicalName,
    type: row.type,
    description: row.description,
    imageUrl: row.imageUrl,
    wikipediaUrl: row.wikipediaUrl,
    wikidataId: row.wikidataId,
    profileLanguage: row.profileLanguage,
    profileStatus: row.profileStatus,
    profileFetchedAt: iso(row.profileFetchedAt),
    profileExpiresAt: iso(row.profileExpiresAt),
    publiclyEnriched: row.publiclyEnrichedAt !== null,
    stale: !row.profileExpiresAt || row.profileExpiresAt <= new Date(),
    aliases: uniqueNames(row.aliases.map((alias) => alias.displayName)),
    sources: row.sources.map((link) => sourceDTO(link.source, link.summary)),
  };
}

export async function queueKnowledgeEntityProfile(
  entityId: string,
  options: { force?: boolean } = {},
): Promise<string> {
  const existing = await prisma.knowledgeEnrichmentJob.findUnique({
    where: {
      targetKey_kind: { targetKey: entityId, kind: "entity_profile" },
    },
    select: { id: true, status: true },
  });
  if (existing?.status === "running" && !options.force) return existing.id;
  if (options.force) {
    await prisma.knowledgeEntity.update({
      where: { id: entityId },
      data: { profileStatus: "pending", profileExpiresAt: null },
    });
  }
  const job = await prisma.knowledgeEnrichmentJob.upsert({
    where: {
      targetKey_kind: { targetKey: entityId, kind: "entity_profile" },
    },
    update: {
      status: "pending",
      entityId,
      runAfter: new Date(),
      lastError: null,
      lockedAt: null,
    },
    create: {
      targetKey: entityId,
      kind: "entity_profile",
      entityId,
    },
  });
  return job.id;
}

export async function runKnowledgeEntityProfileJob(
  jobId: string,
  language: Lang,
  profileHint?: EntityProfileHint,
): Promise<void> {
  const claimed = await prisma.knowledgeEnrichmentJob.updateMany({
    where: { id: jobId, status: "pending", runAfter: { lte: new Date() } },
    data: {
      status: "running",
      lockedAt: new Date(),
      attempts: { increment: 1 },
    },
  });
  if (claimed.count !== 1) return;

  const job = await prisma.knowledgeEnrichmentJob.findUnique({
    where: { id: jobId },
    include: { entity: true },
  });
  if (!job?.entity) return;

  try {
    const searchEntity = profileHint ?? {
      name: job.entity.canonicalName,
    };
    const profile = await findWikipediaProfile(
      searchEntity,
      language,
    );
    const fetchedAt = new Date();
    const expiresAt = new Date(
      fetchedAt.getTime() + (profile ? PROFILE_TTL_MS : NOT_FOUND_TTL_MS),
    );
    if (!profile) {
      await prisma.$transaction([
        prisma.knowledgeEntity.update({
          where: { id: job.entity.id },
          data: {
            profileStatus: "not_found",
            profileFetchedAt: fetchedAt,
            profileExpiresAt: expiresAt,
            description: null,
            imageUrl: null,
            wikipediaUrl: null,
            wikidataId: null,
            profileLanguage: null,
            publiclyEnrichedAt: null,
          },
        }),
        prisma.knowledgeEnrichmentJob.update({
          where: { id: job.id },
          data: { status: "complete", completedAt: fetchedAt, lockedAt: null },
        }),
      ]);
      return;
    }

    const source = await prisma.knowledgeSource.upsert({
      where: { url: canonicalizeUrl(profile.wikipediaUrl) },
      update: {
        title: profile.canonicalName,
        publisher: `${profile.language}.wikipedia.org`,
        sourceType: "wikipedia",
        retrievedAt: fetchedAt,
      },
      create: {
        url: canonicalizeUrl(profile.wikipediaUrl),
        title: profile.canonicalName,
        publisher: `${profile.language}.wikipedia.org`,
        sourceType: "wikipedia",
        retrievedAt: fetchedAt,
        metadata: JSON.stringify({ attribution: "Wikipedia" }),
      },
    });
    const wikidataOwner = profile.wikidataId
      ? await prisma.knowledgeEntity.findUnique({
          where: { wikidataId: profile.wikidataId },
          select: { id: true },
        })
      : null;
    const safeWikidataId =
      !wikidataOwner || wikidataOwner.id === job.entity.id
        ? profile.wikidataId
        : null;

    const observedNames = uniqueNames([
      searchEntity.name,
      ...(searchEntity.aliases ?? []),
    ]);
    const previousProfileWasIncompatible = !isPublicProfileCompatible(
      searchEntity,
      {
        canonicalName: job.entity.canonicalName,
        description: job.entity.description,
      },
    );

    await prisma.knowledgeEntityAlias.createMany({
      data: uniqueNames([...observedNames, profile.canonicalName]).map(
        (displayName) => ({
          entityId: job.entity!.id,
          displayName,
          normalizedName: normalizeKnowledgeName(displayName),
          language: profile.language,
        }),
      ),
      skipDuplicates: true,
    });

    await prisma.$transaction([
      prisma.knowledgeEntity.update({
        where: { id: job.entity.id },
        data: {
          canonicalName: profile.canonicalName,
          description: profile.description,
          imageUrl: profile.imageUrl,
          wikipediaUrl: profile.wikipediaUrl,
          wikidataId: safeWikidataId,
          profileLanguage: profile.language,
          profileStatus: "ready",
          profileFetchedAt: fetchedAt,
          profileExpiresAt: expiresAt,
          publiclyEnrichedAt: fetchedAt,
        },
      }),
      prisma.knowledgeEntitySnapshot.upsert({
        where: {
          entityId_sourceId_language: {
            entityId: job.entity.id,
            sourceId: source.id,
            language: profile.language,
          },
        },
        update: {
          summary: profile.description,
          payload: JSON.stringify({
            canonicalName: profile.canonicalName,
            imageUrl: profile.imageUrl,
            wikidataId: safeWikidataId,
          }),
          fetchedAt,
          expiresAt,
        },
        create: {
          entityId: job.entity.id,
          sourceId: source.id,
          language: profile.language,
          summary: profile.description,
          payload: JSON.stringify({
            canonicalName: profile.canonicalName,
            imageUrl: profile.imageUrl,
            wikidataId: safeWikidataId,
          }),
          fetchedAt,
          expiresAt,
        },
      }),
      prisma.knowledgeEnrichmentJob.update({
        where: { id: job.id },
        data: { status: "complete", completedAt: fetchedAt, lockedAt: null },
      }),
    ]);
    const previousCanonicalName = normalizeKnowledgeName(
      job.entity.canonicalName,
    );
    if (
      previousProfileWasIncompatible &&
      !observedNames.map(normalizeKnowledgeName).includes(previousCanonicalName)
    ) {
      await prisma.knowledgeEntityAlias.deleteMany({
        where: {
          entityId: job.entity.id,
          normalizedName: previousCanonicalName,
        },
      });
    }
  } catch (error) {
    const retryAt = new Date(Date.now() + 60 * 60 * 1_000);
    await prisma.$transaction([
      prisma.knowledgeEntity.update({
        where: { id: job.entity.id },
        data: {
          profileStatus: "failed",
          profileFetchedAt: new Date(),
          profileExpiresAt: retryAt,
        },
      }),
      prisma.knowledgeEnrichmentJob.update({
        where: { id: jobId },
        data: {
          status: "failed",
          lockedAt: null,
          runAfter: retryAt,
          lastError:
            error instanceof Error
              ? error.message.slice(0, 1_000)
              : String(error),
        },
      }),
    ]);
  }
}

export async function attachNewsToEntity(
  entityId: string,
  results: ContextNewsResult[],
): Promise<KnowledgeEntityDTO | null> {
  const expiresAt = new Date(Date.now() + CONTEXT_NEWS_TTL_MS);
  for (const result of results) {
    const source = await upsertNewsSource(result);
    await prisma.knowledgeEntitySource.upsert({
      where: { entityId_sourceId: { entityId, sourceId: source.id } },
      update: {
        relevance: 1,
        summary: result.summary,
        discoveredAt: new Date(),
        expiresAt,
      },
      create: {
        entityId,
        sourceId: source.id,
        relevance: 1,
        summary: result.summary,
        expiresAt,
      },
    });
  }
  if (results.length > 0) {
    await prisma.knowledgeEntity.update({
      where: { id: entityId },
      data: { publiclyEnrichedAt: new Date() },
    });
  }
  return getKnowledgeEntityDTO(entityId);
}

export async function upsertKnowledgeRelationFromCoverage(input: {
  sessionId: string;
  sourceEntityId: string;
  targetEntityId: string;
  relation: LiveContextRelation;
  results: ContextNewsResult[];
}): Promise<KnowledgeRelationDTO> {
  const normalizedLabel = RELATED_COVERAGE_KEY;
  const publicDescription =
    input.results
      .map((result) => result.summary?.trim())
      .find((summary): summary is string => Boolean(summary)) ?? null;
  const relation = await prisma.knowledgeRelation.upsert({
    where: {
      sourceEntityId_targetEntityId_normalizedLabel: {
        sourceEntityId: input.sourceEntityId,
        targetEntityId: input.targetEntityId,
        normalizedLabel,
      },
    },
    update: {
      label: RELATED_COVERAGE_LABEL,
      description: publicDescription,
      status: "related_coverage",
      confidence: 0,
      lastObservedAt: new Date(),
    },
    create: {
      sourceEntityId: input.sourceEntityId,
      targetEntityId: input.targetEntityId,
      normalizedLabel,
      label: RELATED_COVERAGE_LABEL,
      description: publicDescription,
      confidence: 0,
      status: "related_coverage",
    },
  });
  const expiresAt = new Date(Date.now() + CONTEXT_NEWS_TTL_MS);
  for (const result of input.results) {
    const source = await upsertNewsSource(result);
    await prisma.knowledgeRelationSource.upsert({
      where: {
        relationId_sourceId: { relationId: relation.id, sourceId: source.id },
      },
      update: {
        relevance: 1,
        summary: result.summary,
        discoveredAt: new Date(),
        expiresAt,
      },
      create: {
        relationId: relation.id,
        sourceId: source.id,
        relevance: 1,
        summary: result.summary,
        expiresAt,
      },
    });
  }
  if (input.results.length > 0) {
    await prisma.knowledgeEntity.updateMany({
      where: {
        id: { in: [input.sourceEntityId, input.targetEntityId] },
      },
      data: { publiclyEnrichedAt: new Date() },
    });
  }
  await prisma.knowledgeRelationMention.updateMany({
    where: {
      analysisId: input.sessionId,
      sourceEntityId: input.sourceEntityId,
      targetEntityId: input.targetEntityId,
      localRelationId: input.relation.id,
    },
    data: { relationId: relation.id },
  });
  return (await getKnowledgeRelationDTO(relation.id))!;
}

export async function getKnowledgeRelationDTO(
  relationId: string,
): Promise<KnowledgeRelationDTO | null> {
  const row = await prisma.knowledgeRelation.findUnique({
    where: { id: relationId },
    include: {
      sources: {
        orderBy: { discoveredAt: "desc" },
        take: 2,
        include: { source: true },
      },
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    sourceEntityId: row.sourceEntityId,
    targetEntityId: row.targetEntityId,
    label: row.label,
    description: row.description,
    status: row.status,
    confidence: row.confidence,
    sources: row.sources.map((link) => sourceDTO(link.source, link.summary)),
  };
}

export async function getKnowledgeCoverageRelation(input: {
  sourceEntityId: string;
  targetEntityId: string;
}): Promise<KnowledgeRelationDTO | null> {
  const row = await prisma.knowledgeRelation.findUnique({
    where: {
      sourceEntityId_targetEntityId_normalizedLabel: {
        sourceEntityId: input.sourceEntityId,
        targetEntityId: input.targetEntityId,
        normalizedLabel: RELATED_COVERAGE_KEY,
      },
    },
    select: { id: true },
  });
  return row ? getKnowledgeRelationDTO(row.id) : null;
}

export async function canReadKnowledgeEntity(
  entityId: string,
  ownerWorkosUserId: string,
): Promise<boolean> {
  const count = await prisma.knowledgeEntity.count({
    where: {
      id: entityId,
      OR: [
        { publiclyEnrichedAt: { not: null } },
        { mentions: { some: { ownerWorkosUserId } } },
      ],
    },
  });
  return count > 0;
}

export async function getStoredEntityIdForMention(
  sessionId: string,
  localEntityId: string,
): Promise<string | null> {
  const mention = await prisma.knowledgeEntityMention.findFirst({
    where: { analysisId: sessionId, localEntityId },
    select: { entityId: true },
  });
  return mention?.entityId ?? null;
}

async function upsertNewsSource(result: ContextNewsResult) {
  const url = canonicalizeUrl(result.url);
  return prisma.knowledgeSource.upsert({
    where: { url },
    update: {
      title: result.title,
      publisher: result.publisher,
      sourceType: "news",
      retrievedAt: new Date(),
    },
    create: {
      url,
      title: result.title,
      publisher: result.publisher,
      sourceType: "news",
    },
  });
}

function sourceDTO(
  source: {
    id: string;
    title: string;
    url: string;
    publisher: string;
    sourceType: string;
    publishedAt: Date | null;
    retrievedAt: Date;
  },
  summary: string | null,
): KnowledgeSourceDTO {
  return {
    id: source.id,
    title: source.title,
    url: source.url,
    publisher: source.publisher,
    sourceType: source.sourceType,
    publishedAt: iso(source.publishedAt),
    retrievedAt: source.retrievedAt.toISOString(),
    summary,
  };
}

function canonicalizeUrl(value: string): string {
  const url = new URL(value);
  url.hash = "";
  return url.toString();
}

function uniqueNames(values: string[]): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const display = value.trim();
    const normalized = normalizeKnowledgeName(display);
    if (!display || !normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    names.push(display.slice(0, 240));
  }
  return names;
}

function iso(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}
