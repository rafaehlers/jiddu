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
    theme: "light",
    settings: {
      factSourceLimit: 10,
      showMiniMap: false,
      automaticNews: "yes",
    },
    visibility: { facts: false, transcript: false },
    activePanel: "invalid",
    layouts: { facts: { x: "bad" } },
  });

  assert.equal(normalized.theme, "light");
  assert.equal(normalized.settings.factSourceLimit, 10);
  assert.equal(normalized.settings.showMiniMap, false);
  assert.equal(normalized.settings.automaticNews, true);
  assert.equal(normalized.visibility.facts, false);
  assert.equal(normalized.visibility.transcript, false);
  assert.equal(normalized.visibility.fallacies, true);
  assert.equal(normalized.activePanel, "facts");
  assert.equal(normalized.layouts, null);
});

test("migrates the four legacy Context preference keys", () => {
  const values = new Map<string, string>([
    ["jiddu_context_theme_v1", "light"],
    [
      "jiddu_context_settings_v1",
      JSON.stringify({ factSourceLimit: 5, showActivityLog: false }),
    ],
    [
      "jiddu_context_panel_visibility_v1",
      JSON.stringify({ transcript: false, facts: true }),
    ],
    [
      "jiddu_context_floating_panels_v2",
      JSON.stringify(validLayouts()),
    ],
  ]);

  const migrated = readLegacyContextUiState({
    getItem: (key) => values.get(key) ?? null,
  });

  assert.ok(migrated);
  assert.equal(migrated.theme, "light");
  assert.equal(migrated.settings.factSourceLimit, 5);
  assert.equal(migrated.settings.showActivityLog, false);
  assert.equal(migrated.visibility.transcript, false);
  assert.equal(migrated.layouts?.facts.width, 320);
});

test("coordinates settings and panel actions in one isolated store", () => {
  const storage = memoryStorage();
  const store = createContextUiStore(storage);

  store.getState().setTheme("light");
  store.getState().updateSetting("showMiniMap", false);
  store.getState().togglePanel("facts");
  store.getState().selectPanel("transcript");
  store.getState().setLayouts(validLayouts());

  assert.equal(store.getState().theme, "light");
  assert.equal(store.getState().settings.showMiniMap, false);
  assert.equal(store.getState().visibility.facts, false);
  assert.equal(store.getState().activePanel, "transcript");
  assert.equal(store.getState().layouts?.facts.width, 320);

  store.getState().resetPanels();
  assert.equal(store.getState().visibility.facts, true);
  assert.equal(store.getState().activePanel, "facts");
  assert.equal(store.getState().layouts, null);
  assert.equal(store.getState().resetVersion, 1);
});

test("creates independent stores for concurrent Context workspaces", () => {
  const first = createContextUiStore(memoryStorage());
  const second = createContextUiStore(memoryStorage());

  first.getState().setTheme("light");
  first.getState().togglePanel("facts");

  assert.equal(first.getState().theme, "light");
  assert.equal(first.getState().visibility.facts, false);
  assert.equal(second.getState().theme, "dark");
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

function validLayouts() {
  const layout = { x: 12, y: 54, width: 320, height: 240, minimized: true };
  return {
    transcript: { ...layout },
    fallacies: { ...layout },
    facts: { ...layout },
    topics: { ...layout },
    neutrality: { ...layout },
  };
}
