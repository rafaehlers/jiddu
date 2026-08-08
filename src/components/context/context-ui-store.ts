import { createJSONStorage, persist, type PersistStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import {
  ALL_PANELS_VISIBLE,
  CONTEXT_PANEL_IDS,
  normalizePanelLayouts,
  normalizePanelVisibility,
  type ContextPanelId,
  type PanelLayouts,
  type PanelVisibility,
} from "./context-panel-state";
import {
  DEFAULT_CONTEXT_SETTINGS,
  normalizeContextSettings,
  type ContextSettings,
} from "./context-settings-state";

export type ContextTheme = "dark" | "light";

export const CONTEXT_UI_STORAGE_KEY = "jiddu_context_ui_v1";
export const CONTEXT_UI_STORAGE_VERSION = 1;

const LEGACY_STORAGE_KEYS = {
  theme: "jiddu_context_theme_v1",
  settings: "jiddu_context_settings_v1",
  visibility: "jiddu_context_panel_visibility_v1",
  layouts: "jiddu_context_floating_panels_v2",
} as const;

export type ContextUiPersistedState = {
  theme: ContextTheme;
  settings: ContextSettings;
  visibility: PanelVisibility;
  activePanel: ContextPanelId;
  layouts: PanelLayouts | null;
};

export type ContextUiStore = ContextUiPersistedState & {
  hydrated: boolean;
  resetVersion: number;
  setHydrated: (hydrated: boolean) => void;
  setTheme: (theme: ContextTheme) => void;
  updateSetting: <Key extends keyof ContextSettings>(
    key: Key,
    value: ContextSettings[Key],
  ) => void;
  resetSettings: () => void;
  toggleAllPanels: () => void;
  togglePanel: (id: ContextPanelId) => void;
  selectPanel: (id: ContextPanelId) => void;
  resetPanels: () => void;
  setLayouts: (
    next:
      | PanelLayouts
      | null
      | ((current: PanelLayouts | null) => PanelLayouts | null),
  ) => void;
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
        setTheme: (theme) => set({ theme }),
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
            layouts: null,
            resetVersion: state.resetVersion + 1,
          })),
        setLayouts: (next) =>
          set((state) => ({
            layouts:
              typeof next === "function" ? next(state.layouts) : next,
          })),
      }),
      {
        name: CONTEXT_UI_STORAGE_KEY,
        version: CONTEXT_UI_STORAGE_VERSION,
        storage,
        skipHydration: true,
        partialize: (state) => ({
          theme: state.theme,
          settings: state.settings,
          visibility: state.visibility,
          activePanel: state.activePanel,
          layouts: state.layouts,
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
    theme: record.theme === "light" ? "light" : "dark",
    settings: normalizeContextSettings(record.settings),
    visibility: normalizePanelVisibility(record.visibility),
    activePanel: isContextPanelId(record.activePanel)
      ? record.activePanel
      : "facts",
    layouts: normalizePanelLayouts(record.layouts),
  };
}

export function readLegacyContextUiState(storage: {
  getItem: (key: string) => string | null;
}): ContextUiPersistedState | null {
  const raw = {
    theme: storage.getItem(LEGACY_STORAGE_KEYS.theme),
    settings: storage.getItem(LEGACY_STORAGE_KEYS.settings),
    visibility: storage.getItem(LEGACY_STORAGE_KEYS.visibility),
    layouts: storage.getItem(LEGACY_STORAGE_KEYS.layouts),
  };
  if (Object.values(raw).every((value) => value === null)) return null;

  return normalizeContextUiPersistedState({
    theme: raw.theme,
    settings: parseJson(raw.settings),
    visibility: parseJson(raw.visibility),
    layouts: parseJson(raw.layouts),
    activePanel: "facts",
  });
}

function defaultPersistedState(): ContextUiPersistedState {
  return {
    theme: "dark",
    settings: { ...DEFAULT_CONTEXT_SETTINGS },
    visibility: { ...ALL_PANELS_VISIBLE },
    activePanel: "facts",
    layouts: null,
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
