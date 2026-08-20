import type { LiveContextRelation } from "@/lib/live-context-schema";

export type ContextRelationGroup = {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relations: LiveContextRelation[];
  reciprocalLabelOffset: number;
};

const BASE_RECIPROCAL_LABEL_OFFSET = 72;
const PER_RELATION_LABEL_OFFSET = 10;
const MAX_RECIPROCAL_LABEL_OFFSET = 160;

export function groupContextRelations(
  relations: readonly LiveContextRelation[],
): ContextRelationGroup[] {
  const groups = new Map<string, ContextRelationGroup>();

  for (const relation of relations) {
    const key = `${relation.sourceEntityId}\u0000${relation.targetEntityId}`;
    const existing = groups.get(key);
    if (existing) {
      existing.relations.push(relation);
      continue;
    }

    groups.set(key, {
      id: `relation-group:${relation.sourceEntityId}:${relation.targetEntityId}`,
      sourceEntityId: relation.sourceEntityId,
      targetEntityId: relation.targetEntityId,
      relations: [relation],
      reciprocalLabelOffset: 0,
    });
  }

  const groupedRelations = [...groups.values()];
  const groupsByEntityPair = new Map<string, ContextRelationGroup[]>();

  for (const group of groupedRelations) {
    const pairKey = [group.sourceEntityId, group.targetEntityId]
      .sort()
      .join("\u0000");
    const pair = groupsByEntityPair.get(pairKey);
    if (pair) pair.push(group);
    else groupsByEntityPair.set(pairKey, [group]);
  }

  for (const pair of groupsByEntityPair.values()) {
    if (pair.length < 2) continue;
    const largestRelationCount = Math.max(
      ...pair.map((group) => group.relations.length),
    );
    const labelOffset = Math.min(
      MAX_RECIPROCAL_LABEL_OFFSET,
      BASE_RECIPROCAL_LABEL_OFFSET +
        largestRelationCount * PER_RELATION_LABEL_OFFSET,
    );
    for (const group of pair) group.reciprocalLabelOffset = labelOffset;
  }

  return groupedRelations;
}
