import { createJSONStorage, persist, type PersistStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import {
  ALL_PANELS_VISIBLE,
  CONTEXT_PANEL_IDS,
  normalizePanelVisibility,
  type ContextPanelId,
  type PanelVisibility,
} from "./context-panel-state";
import {
  DEFAULT_CONTEXT_SETTINGS,
  normalizeContextSettings,
  type ContextSettings,
} from "./context-settings-state";

export const CONTEXT_UI_STORAGE_KEY = "jiddu_context_ui_v1";
export const CONTEXT_UI_STORAGE_VERSION = 3;

const LEGACY_STORAGE_KEYS = {
  settings: "jiddu_context_settings_v1",
  visibility: "jiddu_context_panel_visibility_v1",
} as const;

export type ContextUiPersistedState = {
  settings: ContextSettings;
  visibility: PanelVisibility;
  activePanel: ContextPanelId;
};

export type ContextUiStore = ContextUiPersistedState & {
  hydrated: boolean;
  resetVersion: number;
  setHydrated: (hydrated: boolean) => void;
  updateSetting: <Key extends keyof ContextSettings>(
    key: Key,
    value: ContextSettings[Key],
  ) => void;
  resetSettings: () => void;
  toggleAllPanels: () => void;
  togglePanel: (id: ContextPanelId) => void;
  setPanelVisibility: (visibility: PanelVisibility) => void;
  selectPanel: (id: ContextPanelId) => void;
  resetPanels: () => void;
};

export function createContextUiStore(
  storage: PersistStorage<ContextUiPersistedState> | undefined =
    createSafeBrowserStorage(),
) {
  return createStore<ContextUiStore>()(
    persist<ContextUiStore, [], [], ContextUiPersistedState>(
      (set) => ({
        ...defaultPersistedState(),
        hydrated: false,
        resetVersion: 0,
        setHydrated: (hydrated) => set({ hydrated }),
        updateSetting: (key, value) =>
          set((state) => ({
            settings: { ...state.settings, [key]: value },
          })),
        resetSettings: () =>
          set({ settings: { ...DEFAULT_CONTEXT_SETTINGS } }),
        toggleAllPanels: () =>
          set((state) => {
            const show = !CONTEXT_PANEL_IDS.some(
              (id) => state.visibility[id],
            );
            return { visibility: mapVisibility(show) };
          }),
        togglePanel: (id) =>
          set((state) => ({
            visibility: {
              ...state.visibility,
              [id]: !state.visibility[id],
            },
          })),
        setPanelVisibility: (visibility) =>
          set((state) =>
            CONTEXT_PANEL_IDS.every(
              (id) => state.visibility[id] === visibility[id],
            )
              ? state
              : { visibility },
          ),
        selectPanel: (id) =>
          set((state) => ({
            activePanel: id,
            visibility: state.visibility[id]
              ? state.visibility
              : { ...state.visibility, [id]: true },
          })),
        resetPanels: () =>
          set((state) => ({
            visibility: { ...ALL_PANELS_VISIBLE },
            activePanel: "facts",
            resetVersion: state.resetVersion + 1,
          })),
      }),
      {
        name: CONTEXT_UI_STORAGE_KEY,
        version: CONTEXT_UI_STORAGE_VERSION,
        storage,
        skipHydration: true,
        partialize: (state) => ({
          settings: state.settings,
          visibility: state.visibility,
          activePanel: state.activePanel,
        }),
        migrate: (persistedState) =>
          normalizeContextUiPersistedState(persistedState),
        merge: (persistedState, currentState) => ({
          ...currentState,
          ...normalizeContextUiPersistedState(persistedState),
        }),
        onRehydrateStorage: () => (state) => state?.setHydrated(true),
      },
    ),
  );
}

function createSafeBrowserStorage() {
  return createJSONStorage<ContextUiPersistedState>(() => ({
    getItem: (key) => {
      if (typeof window === "undefined") return null;
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key, value) => {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Preferences remain usable in memory when storage is unavailable.
      }
    },
    removeItem: (key) => {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Nothing to clear when storage is unavailable.
      }
    },
  }));
}

export type ContextUiStoreApi = ReturnType<typeof createContextUiStore>;

export function normalizeContextUiPersistedState(
  value: unknown,
): ContextUiPersistedState {
  const record = isRecord(value) ? value : {};
  return {
    settings: normalizeContextSettings(record.settings),
    visibility: normalizePanelVisibility(record.visibility),
    activePanel: isContextPanelId(record.activePanel)
      ? record.activePanel
      : "facts",
  };
}

export function readLegacyContextUiState(storage: {
  getItem: (key: string) => string | null;
}): ContextUiPersistedState | null {
  const raw = {
    settings: storage.getItem(LEGACY_STORAGE_KEYS.settings),
    visibility: storage.getItem(LEGACY_STORAGE_KEYS.visibility),
  };
  if (Object.values(raw).every((value) => value === null)) return null;

  return normalizeContextUiPersistedState({
    settings: parseJson(raw.settings),
    visibility: parseJson(raw.visibility),
    activePanel: "facts",
  });
}

function defaultPersistedState(): ContextUiPersistedState {
  return {
    settings: { ...DEFAULT_CONTEXT_SETTINGS },
    visibility: { ...ALL_PANELS_VISIBLE },
    activePanel: "facts",
  };
}

function mapVisibility(value: boolean): PanelVisibility {
  return Object.fromEntries(
    CONTEXT_PANEL_IDS.map((id) => [id, value]),
  ) as PanelVisibility;
}

function isContextPanelId(value: unknown): value is ContextPanelId {
  return CONTEXT_PANEL_IDS.includes(value as ContextPanelId);
}

function parseJson(raw: string | null): unknown {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
