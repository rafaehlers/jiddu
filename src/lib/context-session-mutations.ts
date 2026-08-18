import type {
  LiveContext,
  LiveContextEntity,
  LiveContextRelation,
} from "./live-context-schema";
import type { LiveClaim } from "./live/use-live-analysis";
import { DEFAULT_LIVE_ANALYSIS_CONFIG } from "./live-analysis-config";

export function renameContextEntity(
  context: LiveContext,
  entityId: string,
  requestedName: string,
  correctedAt = new Date(),
): { context: LiveContext; previousName: string; currentName: string } {
  const currentName = requestedName.trim();
  if (!currentName) throw new Error("Entity name cannot be empty");
  const current = context.entities.find((entity) => entity.id === entityId);
  if (!current) throw new Error("Entity not found");
  const previousName = current.name;

  return {
    previousName,
    currentName,
    context: {
      ...context,
      analysisConfig: {
        ...(context.analysisConfig ?? DEFAULT_LIVE_ANALYSIS_CONFIG),
        participants: (
          context.analysisConfig ?? DEFAULT_LIVE_ANALYSIS_CONFIG
        ).participants.map((participant) =>
          participant.entityId === entityId
            ? { ...participant, name: currentName, placeholder: false }
            : participant,
        ),
      },
      entities: context.entities.map((entity) =>
        entity.id === entityId
          ? {
              ...entity,
              name: currentName,
              userCorrectedName: true,
              userCorrectedAt: correctedAt.toISOString(),
              aliases: uniqueLabels([
                ...entity.aliases,
                ...(normalize(previousName) === normalize(currentName)
                  ? []
                  : [previousName]),
              ]).filter((alias) => normalize(alias) !== normalize(currentName)),
              description: replaceEntityName(
                entity.description,
                previousName,
                currentName,
              ),
            }
          : entity,
      ),
      relations: context.relations.map((relation) => ({
        ...relation,
        description: replaceEntityName(
          relation.description,
          previousName,
          currentName,
        ),
      })),
    },
  };
}

export function removeContextEntity(
  context: LiveContext,
  entityId: string,
): { context: LiveContext; removedName: string } {
  const entity = context.entities.find(
    (candidate) => candidate.id === entityId,
  );
  if (!entity) throw new Error("Entity not found");

  return {
    removedName: entity.name,
    context: {
      ...context,
      analysisConfig: {
        ...(context.analysisConfig ?? DEFAULT_LIVE_ANALYSIS_CONFIG),
        participants: (
          context.analysisConfig ?? DEFAULT_LIVE_ANALYSIS_CONFIG
        ).participants.filter(
          (participant) => participant.entityId !== entityId,
        ),
      },
      dismissedEntityNames: uniqueLabels([
        ...context.dismissedEntityNames,
        entity.name,
      ]).slice(-100),
      entities: context.entities.filter(
        (candidate) => candidate.id !== entityId,
      ),
      relations: context.relations.filter(
        (relation) =>
          relation.sourceEntityId !== entityId &&
          relation.targetEntityId !== entityId,
      ),
    },
  };
}

export function mergeContextEntities(
  context: LiveContext,
  sourceEntityId: string,
  targetEntityId: string,
): {
  context: LiveContext;
  sourceName: string;
  previousTargetName: string;
  mergedName: string;
} {
  if (sourceEntityId === targetEntityId) {
    throw new Error("An entity cannot be merged into itself");
  }
  const source = context.entities.find(
    (entity) => entity.id === sourceEntityId,
  );
  const target = context.entities.find(
    (entity) => entity.id === targetEntityId,
  );
  if (!source || !target) throw new Error("Entity not found");
  if (source.kind !== target.kind) {
    throw new Error("Only entities of the same type can be merged");
  }

  const mergedName =
    target.userCorrectedName || !source.userCorrectedName
      ? target.name
      : source.name;
  const mergedEntity: LiveContextEntity = {
    ...target,
    name: mergedName,
    description: replaceEntityName(
      target.description || source.description,
      target.name,
      mergedName,
    ),
    aliases: uniqueLabels([
      ...target.aliases,
      ...source.aliases,
      target.name,
      source.name,
    ]).filter((alias) => normalize(alias) !== normalize(mergedName)),
    sentenceIds: uniqueStrings([...target.sentenceIds, ...source.sentenceIds]),
    confidence: Math.max(target.confidence, source.confidence),
    importance: Math.max(target.importance, source.importance),
    participantRole: target.participantRole ?? source.participantRole,
    userSupplied:
      target.userSupplied || source.userSupplied ? true : undefined,
    placeholder:
      target.userSupplied || source.userSupplied ? false : undefined,
    userCorrectedName:
      target.userCorrectedName || source.userCorrectedName || undefined,
    userCorrectedAt: latestIsoDate(
      target.userCorrectedAt,
      source.userCorrectedAt,
    ),
  };

  const redirectedRelations = context.relations
    .map((relation) =>
      redirectRelation(relation, sourceEntityId, targetEntityId),
    )
    .filter((relation) => relation.sourceEntityId !== relation.targetEntityId);

  return {
    sourceName: source.name,
    previousTargetName: target.name,
    mergedName,
    context: {
      ...context,
      analysisConfig: {
        ...(context.analysisConfig ?? DEFAULT_LIVE_ANALYSIS_CONFIG),
        participants: (
          context.analysisConfig ?? DEFAULT_LIVE_ANALYSIS_CONFIG
        ).participants
          .map((participant) =>
            participant.entityId === sourceEntityId
              ? {
                  ...participant,
                  entityId: targetEntityId,
                  name: mergedName,
                  placeholder: false,
                }
              : participant.entityId === targetEntityId
                ? { ...participant, name: mergedName, placeholder: false }
                : participant,
          )
          .filter(
            (participant, index, participants) =>
              participants.findIndex(
                (candidate) => candidate.entityId === participant.entityId,
              ) === index,
          ),
      },
      entities: context.entities
        .filter((entity) => entity.id !== sourceEntityId)
        .map((entity) =>
          entity.id === targetEntityId ? mergedEntity : entity,
        ),
      relations: deduplicateRelations(redirectedRelations),
    },
  };
}

function latestIsoDate(
  left: string | undefined,
  right: string | undefined,
): string | undefined {
  if (!left) return right;
  if (!right) return left;
  return Date.parse(left) >= Date.parse(right) ? left : right;
}

export function replaceEntityNamesInClaims(
  claims: LiveClaim[],
  replacements: ReadonlyArray<{ from: string; to: string }>,
): LiveClaim[] {
  return claims.map((claim) => ({
    ...claim,
    statement: replacements.reduce(
      (value, replacement) =>
        replaceEntityName(value, replacement.from, replacement.to),
      claim.statement,
    ),
    rationale: replacements.reduce(
      (value, replacement) =>
        replaceEntityName(value, replacement.from, replacement.to),
      claim.rationale,
    ),
    speakerName: claim.speakerName
      ? replacements.reduce(
          (value, replacement) =>
            replaceEntityName(value, replacement.from, replacement.to),
          claim.speakerName,
        )
      : undefined,
  }));
}

function redirectRelation(
  relation: LiveContextRelation,
  sourceEntityId: string,
  targetEntityId: string,
): LiveContextRelation {
  return {
    ...relation,
    sourceEntityId:
      relation.sourceEntityId === sourceEntityId
        ? targetEntityId
        : relation.sourceEntityId,
    targetEntityId:
      relation.targetEntityId === sourceEntityId
        ? targetEntityId
        : relation.targetEntityId,
  };
}

function deduplicateRelations(
  relations: LiveContextRelation[],
): LiveContextRelation[] {
  const byKey = new Map<string, LiveContextRelation>();
  for (const relation of relations) {
    const key = [
      relation.sourceEntityId,
      relation.targetEntityId,
      normalize(relation.label),
    ].join("::");
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...relation, sentenceIds: [...relation.sentenceIds] });
      continue;
    }
    existing.sentenceIds = uniqueStrings([
      ...existing.sentenceIds,
      ...relation.sentenceIds,
    ]);
    existing.importance = Math.max(existing.importance, relation.importance);
    if (relation.confidence > existing.confidence) {
      existing.description = relation.description;
      existing.confidence = relation.confidence;
    }
  }
  return [...byKey.values()];
}

export function replaceEntityName(value: string, from: string, to: string): string {
  const search = from.trim();
  const replacement = to.trim();
  if (!search || !replacement || normalize(search) === normalize(replacement)) {
    return value;
  }
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}])(${escapeRegExp(search)})(?=$|[^\\p{L}\\p{N}])`,
    "giu",
  );
  return value.replace(
    pattern,
    (match, prefix: string, found: string, offset: number) => {
      // Avoid turning an already complete "Daniel Docter" into
      // "Daniel Docter Docter" when correcting the shorter "Daniel".
      const lowerSearch = search.toLocaleLowerCase();
      const lowerReplacement = replacement.toLocaleLowerCase();
      if (lowerReplacement.startsWith(lowerSearch)) {
        const suffix = replacement.slice(search.length);
        const foundStart = offset + prefix.length;
        const existingSuffix = value.slice(
          foundStart + found.length,
          foundStart + found.length + suffix.length,
        );
        if (
          suffix &&
          existingSuffix.toLocaleLowerCase() === suffix.toLocaleLowerCase()
        ) {
          return match;
        }
      }
      return `${prefix}${replacement}`;
    },
  );
}

function uniqueLabels(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = normalize(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
