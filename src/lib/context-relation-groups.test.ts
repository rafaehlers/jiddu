import assert from "node:assert/strict";
import test from "node:test";
import {
  groupContextRelations,
  type ContextRelationGroup,
} from "@/lib/context-relation-groups";
import type { LiveContextRelation } from "@/lib/live-context-schema";

function relation(
  id: string,
  sourceEntityId: string,
  targetEntityId: string,
): LiveContextRelation {
  return {
    id,
    sourceEntityId,
    targetEntityId,
    label: `label ${id}`,
    description: `description ${id}`,
    sentenceIds: ["s1"],
    confidence: 0.9,
    importance: 0.8,
  };
}

test("groups parallel relations into one directional graph connection", () => {
  const groups = groupContextRelations([
    relation("r1", "speaker", "brazil"),
    relation("r2", "speaker", "brazil"),
    relation("r3", "speaker", "brazil"),
  ]);

  assert.equal(groups.length, 1);
  assert.deepEqual(
    groups[0]?.relations.map((item) => item.id),
    ["r1", "r2", "r3"],
  );
});

test("keeps reverse and unrelated directions as separate connections", () => {
  const groups = groupContextRelations([
    relation("r1", "speaker", "brazil"),
    relation("r2", "brazil", "speaker"),
    relation("r3", "speaker", "economy"),
  ]);

  assert.deepEqual(
    groups.map(groupEndpoints),
    ["speaker->brazil", "brazil->speaker", "speaker->economy"],
  );
});

function groupEndpoints(group: ContextRelationGroup): string {
  return `${group.sourceEntityId}->${group.targetEntityId}`;
}
