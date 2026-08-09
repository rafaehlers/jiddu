import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveEntityDisplayName,
  shouldPersistEntityName,
} from "./entity-display-name";

function entity(name: string, userCorrectedName?: boolean) {
  return {
    name,
    aliases: [],
    description: `${name} segundo a conversa`,
    kind: "person" as const,
    userCorrectedName,
  };
}

test("allows the conversation name to override a conflicting public profile name", () => {
  const liveEntity = entity("Serasa");
  const enriched = { canonicalName: "Kampong Serasa" };

  assert.equal(
    resolveEntityDisplayName(liveEntity, enriched),
    "Kampong Serasa",
  );
  assert.equal(shouldPersistEntityName("Serasa", liveEntity, enriched), true);
});

test("keeps a listener-corrected name authoritative", () => {
  const liveEntity = entity("Serasa", true);
  const enriched = { canonicalName: "Kampong Serasa" };

  assert.equal(resolveEntityDisplayName(liveEntity, enriched), "Serasa");
  assert.equal(shouldPersistEntityName("Serasa", liveEntity, enriched), false);
});

test("does not persist an unchanged name when the public profile agrees", () => {
  const liveEntity = entity("Serasa");
  const enriched = { canonicalName: "serasa" };

  assert.equal(shouldPersistEntityName("Serasa", liveEntity, enriched), false);
});

test("does not let an unrelated public profile rename the live entity", () => {
  const liveEntity = {
    ...entity("Lula"),
    description: "Presidente do Brasil e integrante do PT.",
  };
  const enriched = {
    canonicalName: "Teuthida",
    description: "Ordem zoológica da classe dos cefalópodes.",
  };

  assert.equal(resolveEntityDisplayName(liveEntity, enriched), "Lula");
});
