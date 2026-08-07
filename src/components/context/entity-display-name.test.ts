import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveEntityDisplayName,
  shouldPersistEntityName,
} from "./entity-display-name";

test("allows the conversation name to override a conflicting public profile name", () => {
  const entity = { name: "Serasa", userCorrectedName: undefined };
  const enriched = { canonicalName: "Kampong Serasa" };

  assert.equal(resolveEntityDisplayName(entity, enriched), "Kampong Serasa");
  assert.equal(shouldPersistEntityName("Serasa", entity, enriched), true);
});

test("keeps a listener-corrected name authoritative", () => {
  const entity = { name: "Serasa", userCorrectedName: true };
  const enriched = { canonicalName: "Kampong Serasa" };

  assert.equal(resolveEntityDisplayName(entity, enriched), "Serasa");
  assert.equal(shouldPersistEntityName("Serasa", entity, enriched), false);
});

test("does not persist an unchanged name when the public profile agrees", () => {
  const entity = { name: "Serasa", userCorrectedName: undefined };
  const enriched = { canonicalName: "serasa" };

  assert.equal(shouldPersistEntityName("Serasa", entity, enriched), false);
});
