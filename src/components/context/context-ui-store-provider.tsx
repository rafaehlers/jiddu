"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import {
  CONTEXT_UI_STORAGE_KEY,
  createContextUiStore,
  readLegacyContextUiState,
  type ContextUiStore,
  type ContextUiStoreApi,
} from "./context-ui-store";

const ContextUiStoreContext = createContext<ContextUiStoreApi | null>(null);

export function ContextUiStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState<ContextUiStoreApi>(createContextUiStore);

  useEffect(() => {
    const rehydrate = () =>
      Promise.resolve(store.persist.rehydrate())
        .catch(() => undefined)
        .finally(() => {
          store.getState().setHydrated(true);
        });

    try {
      if (window.localStorage.getItem(CONTEXT_UI_STORAGE_KEY) === null) {
        const legacy = readLegacyContextUiState(window.localStorage);
        if (legacy) store.setState(legacy);
      }
    } catch {
      // Defaults remain usable when browser storage is unavailable.
    }

    void rehydrate();

    const syncAcrossTabs = (event: StorageEvent) => {
      if (event.key === CONTEXT_UI_STORAGE_KEY) {
        void rehydrate();
      }
    };
    window.addEventListener("storage", syncAcrossTabs);
    return () => window.removeEventListener("storage", syncAcrossTabs);
  }, [store]);

  return (
    <ContextUiStoreContext.Provider value={store}>
      {children}
    </ContextUiStoreContext.Provider>
  );
}

export function useContextUiStore<Selection>(
  selector: (state: ContextUiStore) => Selection,
): Selection {
  const store = useContext(ContextUiStoreContext);
  if (!store) {
    throw new Error("useContextUiStore must be used inside ContextUiStoreProvider");
  }
  return useStore(store, selector);
}
