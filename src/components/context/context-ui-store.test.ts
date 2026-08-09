import assert from "node:assert/strict";
import test from "node:test";
import type { PersistStorage, StorageValue } from "zustand/middleware";
import {
  createContextUiStore,
  normalizeContextUiPersistedState,
  readLegacyContextUiState,
  type ContextUiPersistedState,
} from "./context-ui-store";

test("normalizes persisted UI state instead of trusting browser storage", () => {
  const normalized = normalizeContextUiPersistedState({
    settings: {
      factSourceLimit: 10,
      showMiniMap: false,
      automaticNews: "yes",
    },
    visibility: { facts: false, transcript: false },
    activePanel: "invalid",
  });

  assert.equal(normalized.settings.factSourceLimit, 10);
  assert.equal(normalized.settings.showMiniMap, false);
  assert.equal(normalized.settings.automaticNews, true);
  assert.equal(normalized.visibility.facts, false);
  assert.equal(normalized.visibility.transcript, false);
  assert.equal(normalized.visibility.fallacies, true);
  assert.equal(normalized.activePanel, "facts");
});

test("migrates the legacy Context preference keys", () => {
  const values = new Map<string, string>([
    [
      "jiddu_context_settings_v1",
      JSON.stringify({ factSourceLimit: 5, showActivityLog: false }),
    ],
    [
      "jiddu_context_panel_visibility_v1",
      JSON.stringify({ transcript: false, facts: true }),
    ],
  ]);

  const migrated = readLegacyContextUiState({
    getItem: (key) => values.get(key) ?? null,
  });

  assert.ok(migrated);
  assert.equal(migrated.settings.factSourceLimit, 5);
  assert.equal(migrated.settings.showActivityLog, false);
  assert.equal(migrated.visibility.transcript, false);
});

test("coordinates settings and panel actions in one isolated store", () => {
  const storage = memoryStorage();
  const store = createContextUiStore(storage);

  store.getState().updateSetting("showMiniMap", false);
  store.getState().togglePanel("facts");
  store.getState().selectPanel("transcript");

  assert.equal(store.getState().settings.showMiniMap, false);
  assert.equal(store.getState().visibility.facts, false);
  assert.equal(store.getState().activePanel, "transcript");

  store.getState().setPanelVisibility({
    transcript: true,
    fallacies: false,
    facts: true,
    topics: false,
    neutrality: true,
  });
  assert.equal(store.getState().visibility.facts, true);
  assert.equal(store.getState().visibility.topics, false);

  store.getState().resetPanels();
  assert.equal(store.getState().visibility.facts, true);
  assert.equal(store.getState().activePanel, "facts");
  assert.equal(store.getState().resetVersion, 1);
});

test("creates independent stores for concurrent Context workspaces", () => {
  const first = createContextUiStore(memoryStorage());
  const second = createContextUiStore(memoryStorage());

  first.getState().togglePanel("facts");

  assert.equal(first.getState().visibility.facts, false);
  assert.equal(second.getState().visibility.facts, true);
});

function memoryStorage(): PersistStorage<ContextUiPersistedState> {
  let value: StorageValue<ContextUiPersistedState> | null = null;
  return {
    getItem: () => value,
    setItem: (_key, next) => {
      value = next;
    },
    removeItem: () => {
      value = null;
    },
  };
}
