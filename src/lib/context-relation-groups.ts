import type { LiveContextRelation } from "@/lib/live-context-schema";

export type ContextRelationGroup = {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relations: LiveContextRelation[];
};

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
    });
  }

  return [...groups.values()];
}
