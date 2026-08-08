"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import {
  createContextSessionStore,
  type ContextSessionEvent,
  type ContextSessionStore,
  type ContextSessionStoreApi,
} from "./context-session-store";

const ContextSessionStoreContext =
  createContext<ContextSessionStoreApi | null>(null);

export function ContextSessionStoreProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [store] = useState<ContextSessionStoreApi>(createContextSessionStore);

  return (
    <ContextSessionStoreContext.Provider value={store}>
      {children}
    </ContextSessionStoreContext.Provider>
  );
}

export function useContextSessionStore<Selection>(
  selector: (state: ContextSessionStore) => Selection,
): Selection {
  const store = useContextSessionStoreApi();
  return useStore(store, selector);
}

export function useContextSessionStoreApi(): ContextSessionStoreApi {
  const store = useContext(ContextSessionStoreContext);
  if (!store) {
    throw new Error(
      "useContextSessionStore must be used inside ContextSessionStoreProvider",
    );
  }
  return store;
}

export function useContextEventPersistence(sessionId: string | null) {
  const store = useContextSessionStoreApi();
  const revision = useStore(store, (state) => state.eventRevision);
  const activeRequestRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const flushTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      !sessionId ||
      activeRequestRef.current ||
      flushTimeoutRef.current != null ||
      retryTimeoutRef.current != null
    ) {
      return;
    }
    if (!store.getState().events.some((event) => event.syncStatus === "pending")) {
      return;
    }

    flushTimeoutRef.current = window.setTimeout(() => {
      flushTimeoutRef.current = null;
      const pending = store
        .getState()
        .events.filter((event) => event.syncStatus === "pending")
        .slice(0, 50);
      if (pending.length === 0) return;

      const controller = new AbortController();
      activeRequestRef.current = controller;
      const ids = pending.map((event) => event.id);
      store.getState().markEvents(ids, "syncing");

      void fetch(
        `/api/context/sessions/${encodeURIComponent(sessionId)}/events`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ events: pending.map(persistableEvent) }),
          signal: controller.signal,
        },
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Event sync failed (${response.status})`);
          }
          if (activeRequestRef.current === controller) {
            activeRequestRef.current = null;
          }
          store.getState().markEvents(ids, "synced");
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            if (activeRequestRef.current === controller) {
              activeRequestRef.current = null;
            }
            retryTimeoutRef.current = window.setTimeout(() => {
              retryTimeoutRef.current = null;
              store.getState().markEvents(ids, "pending");
            }, 2_000);
          }
        })
        .finally(() => {
          if (activeRequestRef.current === controller) {
            activeRequestRef.current = null;
          }
        });
    }, 750);
  }, [revision, sessionId, store]);

  useEffect(
    () => () => {
      activeRequestRef.current?.abort();
      if (retryTimeoutRef.current != null) {
        window.clearTimeout(retryTimeoutRef.current);
      }
      if (flushTimeoutRef.current != null) {
        window.clearTimeout(flushTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const flushOnPageHide = () => {
      if (!sessionId) return;
      const pending = store
        .getState()
        .events.filter(
          (event) =>
            event.syncStatus === "pending" || event.syncStatus === "syncing",
        )
        .slice(0, 25);
      if (pending.length === 0) return;
      void fetch(
        `/api/context/sessions/${encodeURIComponent(sessionId)}/events`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            events: pending.map(persistableEvent),
          }),
          keepalive: true,
        },
      );
    };
    window.addEventListener("pagehide", flushOnPageHide);
    return () => window.removeEventListener("pagehide", flushOnPageHide);
  }, [sessionId, store]);
}

export function useContextRecoveryMarker(input: {
  sessionId: string | null;
  state: ContextSessionStore["capture"]["state"];
}) {
  const [recoverableSessionId, setRecoverableSessionId] = useState<
    string | null
  >(null);

  useEffect(() => {
    let timeout: number | null = null;
    try {
      const raw = window.sessionStorage.getItem(CONTEXT_RECOVERY_KEY);
      if (!raw) return;
      const value = JSON.parse(raw) as { id?: unknown; updatedAt?: unknown };
      if (
        typeof value.id === "string" &&
        typeof value.updatedAt === "number" &&
        Date.now() - value.updatedAt < RECOVERY_TTL_MS
      ) {
        const recoveredId = value.id;
        timeout = window.setTimeout(() => setRecoverableSessionId(recoveredId), 0);
      } else {
        window.sessionStorage.removeItem(CONTEXT_RECOVERY_KEY);
      }
    } catch {
      // Recovery is optional when sessionStorage is unavailable.
    }
    return () => {
      if (timeout != null) window.clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!input.sessionId) return;
    try {
      window.sessionStorage.setItem(
        CONTEXT_RECOVERY_KEY,
        JSON.stringify({
          id: input.sessionId,
          state: input.state,
          updatedAt: Date.now(),
        }),
      );
    } catch {
      // The persisted Analysis remains recoverable from the account history.
    }
  }, [input.sessionId, input.state]);

  return input.sessionId ?? recoverableSessionId;
}

const CONTEXT_RECOVERY_KEY = "jiddu_context_recovery_v1";
const RECOVERY_TTL_MS = 24 * 60 * 60 * 1_000;

export function clearContextRecoveryMarker() {
  try {
    window.sessionStorage.removeItem(CONTEXT_RECOVERY_KEY);
  } catch {
    // Recovery is optional when sessionStorage is unavailable.
  }
}

function persistableEvent(event: ContextSessionEvent) {
  return {
    id: event.id,
    kind: event.kind,
    elapsedMs: event.elapsedMs,
    sentenceIds: event.sentenceIds,
    payload: event.payload,
    createdAt: event.createdAt,
  };
}
