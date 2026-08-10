"use client";

import "dockview-react/dist/styles/dockview.css";

import {
  DockviewReact,
  themeDark,
  themeLight,
  type DockviewApi,
  type DockviewReadyEvent,
  type IDockviewPanelHeaderProps,
  type IDockviewPanelProps,
  type SerializedDockview,
} from "dockview-react";
import { ChevronDown, Eye, EyeOff, RotateCcw, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ContextCopy } from "./context-copy";
import {
  CONTEXT_PANEL_IDS,
  type ContextPanelId,
  type PanelVisibility,
} from "./context-panel-state";
import type { ContextTheme } from "./context-theme-control";
import { planDefaultDesktopLayout } from "./context-dockview-layout";
import { useContextUiStore } from "./context-ui-store-provider";
import styles from "./context-dockview.module.css";

export { CONTEXT_PANEL_IDS, type ContextPanelId } from "./context-panel-state";

const GRAPH_PANEL_ID = "context-graph";
const GRAPH_COMPONENT = "context-graph";
const TOOL_COMPONENT = "context-tool";
const GRAPH_TAB_COMPONENT = "context-graph-tab";
const TOOL_TAB_COMPONENT = "context-tool-tab";
const DESKTOP_LAYOUT_KEY = "jiddu_context_dockview_desktop_v1";
const COMPACT_LAYOUT_KEY = "jiddu_context_dockview_compact_v1";

type DockviewMode = "compact" | "desktop";
type DockPanelParams = { panelId: ContextPanelId | typeof GRAPH_PANEL_ID };

export type ContextDockviewState = {
  visibility: PanelVisibility;
  activePanel: ContextPanelId;
  visibleCount: number;
  anyVisible: boolean;
  resetVersion: number;
  toggleAll: () => void;
  togglePanel: (id: ContextPanelId) => void;
  selectPanel: (id: ContextPanelId) => void;
  resetPanels: () => void;
  setVisibility: (visibility: PanelVisibility) => void;
  registerApi: (api: DockviewApi | null) => void;
};

export type ContextDockviewPanelDefinition = {
  title: string;
  count?: number;
  toneClass: string;
  content: ReactNode;
  contentClassName?: string;
};

type DockviewContentRegistry = {
  graph: ReactNode;
  graphTitle: string;
  panels: Record<ContextPanelId, ContextDockviewPanelDefinition>;
  hidePanelLabel: string;
};

const DockviewContentContext = createContext<DockviewContentRegistry | null>(
  null,
);

export function useContextDockview(): ContextDockviewState {
  const visibility = useContextUiStore((state) => state.visibility);
  const activePanel = useContextUiStore((state) => state.activePanel);
  const resetVersion = useContextUiStore((state) => state.resetVersion);
  const toggleAll = useContextUiStore((state) => state.toggleAllPanels);
  const togglePanel = useContextUiStore((state) => state.togglePanel);
  const setVisibility = useContextUiStore(
    (state) => state.setPanelVisibility,
  );
  const storeSelectPanel = useContextUiStore((state) => state.selectPanel);
  const resetPanels = useContextUiStore((state) => state.resetPanels);
  const apiRef = useRef<DockviewApi | null>(null);

  const registerApi = useCallback((api: DockviewApi | null) => {
    apiRef.current = api;
  }, []);
  const selectPanel = useCallback(
    (id: ContextPanelId) => {
      storeSelectPanel(id);
      window.requestAnimationFrame(() => {
        apiRef.current?.getPanel(id)?.api.setActive();
      });
    },
    [storeSelectPanel],
  );
  const visibleCount = CONTEXT_PANEL_IDS.filter((id) => visibility[id]).length;

  return {
    visibility,
    activePanel,
    visibleCount,
    anyVisible: visibleCount > 0,
    resetVersion,
    toggleAll,
    togglePanel,
    selectPanel,
    resetPanels,
    setVisibility,
    registerApi,
  };
}

export function ContextPanelsControl({
  state,
  labels,
  copy,
}: {
  state: ContextDockviewState;
  labels: Record<ContextPanelId, string>;
  copy: ContextCopy;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [compactMode, setCompactMode] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setCompactMode(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const handlePanelAction = (id: ContextPanelId) => {
    if (compactMode) {
      state.selectPanel(id);
      detailsRef.current?.removeAttribute("open");
      return;
    }
    state.togglePanel(id);
  };

  return (
    <div className="relative inline-flex shrink-0 items-stretch rounded-md border border-rule bg-paper text-xs">
      <button
        type="button"
        aria-pressed={state.anyVisible}
        onClick={state.toggleAll}
        className="inline-flex items-center gap-1.5 rounded-l-md px-2.5 py-1.5 text-foreground transition-colors hover:bg-foreground/10"
      >
        {state.anyVisible ? (
          <Eye className="size-3.5" />
        ) : (
          <EyeOff className="size-3.5" />
        )}
        <span className="hidden sm:inline">
          {state.anyVisible ? copy.hidePanels : copy.showPanels}
        </span>
        <span className="rounded-full bg-background px-1.5 py-0.5 text-[9px] tabular-nums text-muted">
          {state.visibleCount}/5
        </span>
      </button>
      <details ref={detailsRef} className="group relative border-l border-rule">
        <summary
          aria-label={copy.panelSettings}
          title={copy.panelSettings}
          className="grid h-full cursor-pointer list-none place-items-center rounded-r-md px-2 text-muted transition-colors hover:bg-foreground/10 hover:text-foreground [&::-webkit-details-marker]:hidden"
        >
          <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
        </summary>
        <div className="absolute left-0 top-full z-[70] mt-2 w-56 max-w-[calc(100vw-1rem)] rounded-lg border border-rule bg-background p-2 shadow-2xl sm:left-auto sm:right-0">
          <p className="px-2 pb-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted">
            {copy.panelSettings}
          </p>
          {CONTEXT_PANEL_IDS.map((id) => {
            const selected = compactMode
              ? state.activePanel === id && state.visibility[id]
              : state.visibility[id];
            return (
              <button
                key={id}
                type="button"
                aria-pressed={selected}
                onClick={() => handlePanelAction(id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-paper"
              >
                {selected ? (
                  <Eye className="size-3.5 text-foreground" />
                ) : (
                  <EyeOff className="size-3.5 text-muted" />
                )}
                <span className={selected ? "" : "text-muted"}>
                  {labels[id]}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              state.resetPanels();
              detailsRef.current?.removeAttribute("open");
            }}
            className="mt-1 flex w-full items-center gap-2 border-t border-rule px-2 pt-2 text-left text-muted hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
            {copy.resetPanels}
          </button>
        </div>
      </details>
    </div>
  );
}

export function ContextDockview({
  state,
  panels,
  graph,
  graphTitle,
  theme,
  copy,
}: {
  state: ContextDockviewState;
  panels: Record<ContextPanelId, ContextDockviewPanelDefinition>;
  graph: ReactNode;
  graphTitle: string;
  theme: ContextTheme;
  copy: ContextCopy;
}) {
  const [mode, setMode] = useState<DockviewMode>("desktop");
  const [readyVersion, setReadyVersion] = useState(0);
  const apiRef = useRef<DockviewApi | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const syncTimerRef = useRef<number | null>(null);
  const initializingRef = useRef(true);
  const appliedResetRef = useRef(state.resetVersion);
  const visibilityRef = useRef(state.visibility);
  const activePanelRef = useRef(state.activePanel);
  const setVisibilityRef = useRef(state.setVisibility);
  const selectPanelRef = useRef(state.selectPanel);
  const registerApi = state.registerApi;

  const registry = useMemo<DockviewContentRegistry>(
    () => ({
      graph,
      graphTitle,
      panels,
      hidePanelLabel: copy.hidePanel,
    }),
    [copy.hidePanel, graph, graphTitle, panels],
  );
  const panelTitlesKey = CONTEXT_PANEL_IDS.map(
    (id) => panels[id].title,
  ).join("\u0000");

  useEffect(() => {
    visibilityRef.current = state.visibility;
    activePanelRef.current = state.activePanel;
    setVisibilityRef.current = state.setVisibility;
    selectPanelRef.current = state.selectPanel;
  }, [
    state.activePanel,
    state.selectPanel,
    state.setVisibility,
    state.visibility,
  ]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setMode(media.matches ? "compact" : "desktop");
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const persistCurrentLayout = useCallback(
    (api: DockviewApi) => {
      if (initializingRef.current) return;
      try {
        window.localStorage.setItem(
          storageKey(mode),
          JSON.stringify(api.toJSON()),
        );
      } catch {
        // The layout remains usable in memory when storage is unavailable.
      }
    },
    [mode],
  );

  const scheduleDockviewSync = useCallback(
    (api: DockviewApi) => {
      if (syncTimerRef.current !== null) {
        window.clearTimeout(syncTimerRef.current);
      }
      syncTimerRef.current = window.setTimeout(() => {
        syncTimerRef.current = null;
        if (initializingRef.current || apiRef.current !== api) return;
        if (!api.getPanel(GRAPH_PANEL_ID)) addGraphPanel(api, graphTitle);

        const nextVisibility = Object.fromEntries(
          CONTEXT_PANEL_IDS.map((id) => [id, Boolean(api.getPanel(id))]),
        ) as PanelVisibility;
        setVisibilityRef.current(nextVisibility);

        const activeId = api.activePanel?.id;
        if (isContextPanelId(activeId)) {
          selectPanelRef.current(activeId);
        }
        persistCurrentLayout(api);
      }, 120);
    },
    [graphTitle, persistCurrentLayout],
  );

  const handleReady = useCallback(
    (event: DockviewReadyEvent) => {
      cleanupRef.current?.();
      const api = event.api;
      apiRef.current = api;
      registerApi(api);
      initializingRef.current = true;

      let restored = false;
      const saved = readSavedLayout(mode);
      if (saved) {
        try {
          api.fromJSON(saved);
          restored = true;
        } catch {
          removeSavedLayout(mode);
        }
      }
      if (!restored) {
        buildDefaultLayout(
          api,
          visibilityRef.current,
          activePanelRef.current,
          mode,
          graphTitle,
        );
      }

      reconcilePanels(
        api,
        visibilityRef.current,
        activePanelRef.current,
        mode,
        graphTitle,
      );
      updatePanelTitles(api, graphTitle, panels);

      const disposables = [
        api.onDidLayoutChange(() => scheduleDockviewSync(api)),
        api.onDidMutateLayout(() => scheduleDockviewSync(api)),
        api.onDidMovePanel(() => scheduleDockviewSync(api)),
        api.onDidActivePanelChange(({ panel }) => {
          if (isContextPanelId(panel?.id)) {
            selectPanelRef.current(panel.id);
          }
        }),
        api.onWillDragPanel((event) => {
          if (event.panel.id === GRAPH_PANEL_ID) {
            event.nativeEvent.preventDefault();
          }
        }),
        api.onWillDragGroup((event) => {
          if (event.group.panels.some((panel) => panel.id === GRAPH_PANEL_ID)) {
            event.nativeEvent.preventDefault();
          }
        }),
      ];

      const frame = window.requestAnimationFrame(() => {
        if (apiRef.current !== api) return;
        initializingRef.current = false;
        persistCurrentLayout(api);
      });
      setReadyVersion((current) => current + 1);

      cleanupRef.current = () => {
        window.cancelAnimationFrame(frame);
        if (syncTimerRef.current !== null) {
          window.clearTimeout(syncTimerRef.current);
          syncTimerRef.current = null;
        }
        for (const disposable of disposables) disposable.dispose();
        if (apiRef.current === api) {
          apiRef.current = null;
          registerApi(null);
        }
      };
    },
    [
      graphTitle,
      mode,
      panels,
      persistCurrentLayout,
      registerApi,
      scheduleDockviewSync,
    ],
  );

  useEffect(
    () => () => {
      cleanupRef.current?.();
    },
    [],
  );

  useEffect(() => {
    const api = apiRef.current;
    if (!api || state.resetVersion === appliedResetRef.current) return;
    appliedResetRef.current = state.resetVersion;
    removeSavedLayout("desktop");
    removeSavedLayout("compact");
    initializingRef.current = true;
    api.clear();
    buildDefaultLayout(
      api,
      state.visibility,
      state.activePanel,
      mode,
      graphTitle,
    );
    updatePanelTitles(api, graphTitle, panels);
    window.requestAnimationFrame(() => {
      if (apiRef.current !== api) return;
      initializingRef.current = false;
      persistCurrentLayout(api);
    });
  }, [
    graphTitle,
    mode,
    panels,
    persistCurrentLayout,
    state.activePanel,
    state.resetVersion,
    state.visibility,
  ]);

  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    reconcilePanels(
      api,
      state.visibility,
      state.activePanel,
      mode,
      graphTitle,
    );
  }, [graphTitle, mode, readyVersion, state.activePanel, state.visibility]);

  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    updatePanelTitles(api, graphTitle, panels);
  }, [graphTitle, panelTitlesKey, panels, readyVersion]);

  return (
    <DockviewContentContext.Provider value={registry}>
      <div
        aria-label={copy.panels}
        className={styles.shell}
      >
        <DockviewReact
          key={mode}
          theme={theme === "dark" ? themeDark : themeLight}
          components={DOCKVIEW_COMPONENTS}
          tabComponents={DOCKVIEW_TAB_COMPONENTS}
          onReady={handleReady}
          dndStrategy="pointer"
          floatingGroupBounds="boundedWithinViewport"
          floatingGroupDragHandle="titlebar"
          keyboardNavigation
          noPanelsOverlay="emptyGroup"
          scrollbars={mode === "compact" ? "native" : "custom"}
          disableTabsOverflowList={mode === "compact"}
          getTabContextMenuItems={({ panel }) =>
            panel.id === GRAPH_PANEL_ID ? [] : ["close"]
          }
        />
      </div>
    </DockviewContentContext.Provider>
  );
}

function ContextGraphPanel() {
  const registry = useDockviewContent();
  return <div className="relative h-full min-h-0">{registry.graph}</div>;
}

function ContextToolPanel({ params }: IDockviewPanelProps) {
  const registry = useDockviewContent();
  const panelId = readToolPanelId(params);
  if (!panelId) return null;
  const panel = registry.panels[panelId];
  return (
    <section
      aria-label={panel.title}
      className={`h-full min-h-0 bg-background ${
        panel.contentClassName ?? "overflow-y-auto p-3"
      }`}
    >
      {panel.content}
    </section>
  );
}

function ContextGraphTab() {
  const registry = useDockviewContent();
  return (
    <div className="dv-default-tab px-2.5 font-semibold">
      <span className={styles.tabTitle}>{registry.graphTitle}</span>
    </div>
  );
}

function ContextToolTab({ api, params }: IDockviewPanelHeaderProps) {
  const registry = useDockviewContent();
  const panelId = readToolPanelId(params);
  if (!panelId) return null;
  const panel = registry.panels[panelId];
  return (
    <div className="dv-default-tab gap-2 px-2.5 font-semibold">
      <span className={styles.tabLabel}>
        <span className={`size-1.5 shrink-0 rounded-full ${panel.toneClass}`} />
        <span className={styles.tabTitle}>{panel.title}</span>
        {panel.count !== undefined ? (
          <span className={styles.tabCount}>{panel.count}</span>
        ) : null}
      </span>
      <button
        type="button"
        aria-label={registry.hidePanelLabel}
        title={registry.hidePanelLabel}
        className={styles.closeButton}
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          api.close();
        }}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

const DOCKVIEW_COMPONENTS = {
  [GRAPH_COMPONENT]: ContextGraphPanel,
  [TOOL_COMPONENT]: ContextToolPanel,
};

const DOCKVIEW_TAB_COMPONENTS = {
  [GRAPH_TAB_COMPONENT]: ContextGraphTab,
  [TOOL_TAB_COMPONENT]: ContextToolTab,
};

function useDockviewContent() {
  const value = useContext(DockviewContentContext);
  if (!value) {
    throw new Error("Context dockview content is unavailable");
  }
  return value;
}

function buildDefaultLayout(
  api: DockviewApi,
  visibility: PanelVisibility,
  activePanel: ContextPanelId,
  mode: DockviewMode,
  graphTitle: string,
) {
  addGraphPanel(api, graphTitle);
  if (mode === "compact") {
    let reference = GRAPH_PANEL_ID;
    const compactOrder = [
      activePanel,
      ...CONTEXT_PANEL_IDS.filter((id) => id !== activePanel),
    ];
    for (const id of compactOrder) {
      if (!visibility[id]) continue;
      addToolPanel(api, id, {
        direction: reference === GRAPH_PANEL_ID ? "below" : "within",
        referencePanel: reference,
        initialHeight: Math.max(190, Math.round(api.height * 0.42)),
        inactive: id !== activePanel,
      });
      reference = id;
    }
  } else {
    for (const placement of planDefaultDesktopLayout(
      visibility,
      GRAPH_PANEL_ID,
    )) {
      addToolPanel(api, placement.id, {
        direction: placement.direction,
        referencePanel: placement.referencePanel,
        initialWidth: placement.initialWidthRatio
          ? desktopSideWidth(api.width, placement.initialWidthRatio)
          : undefined,
        initialHeight: placement.initialHeightRatio
          ? desktopRowHeight(api.height, placement.initialHeightRatio)
          : undefined,
      });
    }
    normalizeDefaultDesktopSizes(api, visibility);
  }

  const requested = visibility[activePanel]
    ? activePanel
    : GRAPH_PANEL_ID;
  api.getPanel(requested)?.api.setActive();
}

function reconcilePanels(
  api: DockviewApi,
  visibility: PanelVisibility,
  activePanel: ContextPanelId,
  mode: DockviewMode,
  graphTitle: string,
) {
  if (!api.getPanel(GRAPH_PANEL_ID)) addGraphPanel(api, graphTitle);

  for (const id of CONTEXT_PANEL_IDS) {
    const existing = api.getPanel(id);
    if (!visibility[id] && existing) {
      api.removePanel(existing);
      continue;
    }
    if (visibility[id] && !existing) {
      addToolPanelAtPreferredLocation(api, id, mode);
    }
  }

  const active = visibility[activePanel]
    ? api.getPanel(activePanel)
    : api.getPanel(GRAPH_PANEL_ID);
  active?.api.setActive();
}

function addToolPanelAtPreferredLocation(
  api: DockviewApi,
  id: ContextPanelId,
  mode: DockviewMode,
) {
  if (mode === "compact") {
    const reference =
      CONTEXT_PANEL_IDS.find((candidate) => api.getPanel(candidate)) ??
      GRAPH_PANEL_ID;
    addToolPanel(api, id, {
      direction: reference === GRAPH_PANEL_ID ? "below" : "within",
      referencePanel: reference,
      initialHeight: Math.max(190, Math.round(api.height * 0.42)),
    });
    return;
  }

  const placement = preferredDesktopPlacement(api, id);
  addToolPanel(api, id, {
    direction: placement.direction,
    referencePanel: placement.referencePanel,
    initialWidth: placement.side
      ? desktopSideWidth(api.width, 0.145)
      : undefined,
    initialHeight: placement.side
      ? undefined
      : desktopRowHeight(
          api.height,
          id === "transcript" || id === "topics" ? 0.5 : 1 / 3,
        ),
  });
}

function preferredDesktopPlacement(
  api: DockviewApi,
  id: ContextPanelId,
): {
  direction: "above" | "below" | "left" | "right";
  referencePanel: string;
  side: boolean;
} {
  if (id === "transcript") {
    return api.getPanel("topics")
      ? { direction: "above", referencePanel: "topics", side: false }
      : { direction: "left", referencePanel: GRAPH_PANEL_ID, side: true };
  }
  if (id === "topics") {
    return api.getPanel("transcript")
      ? { direction: "below", referencePanel: "transcript", side: false }
      : { direction: "left", referencePanel: GRAPH_PANEL_ID, side: true };
  }
  if (id === "facts") {
    const sibling = api.getPanel("neutrality")
      ? "neutrality"
      : api.getPanel("fallacies")
        ? "fallacies"
        : null;
    return sibling
      ? { direction: "above", referencePanel: sibling, side: false }
      : { direction: "right", referencePanel: GRAPH_PANEL_ID, side: true };
  }
  if (id === "neutrality") {
    if (api.getPanel("facts")) {
      return { direction: "below", referencePanel: "facts", side: false };
    }
    if (api.getPanel("fallacies")) {
      return { direction: "above", referencePanel: "fallacies", side: false };
    }
    return { direction: "right", referencePanel: GRAPH_PANEL_ID, side: true };
  }
  const sibling = api.getPanel("neutrality")
    ? "neutrality"
    : api.getPanel("facts")
      ? "facts"
      : null;
  return sibling
    ? { direction: "below", referencePanel: sibling, side: false }
    : { direction: "right", referencePanel: GRAPH_PANEL_ID, side: true };
}

function desktopSideWidth(width: number, ratio: number): number {
  return Math.max(240, Math.min(320, Math.round(width * ratio)));
}

function desktopRowHeight(height: number, ratio: number): number {
  return Math.max(150, Math.round(height * ratio));
}

function normalizeDefaultDesktopSizes(
  api: DockviewApi,
  visibility: PanelVisibility,
) {
  const leftPanels = (["transcript", "topics"] as const).filter(
    (id) => visibility[id] && api.getPanel(id),
  );
  const rightPanels = (["facts", "neutrality", "fallacies"] as const).filter(
    (id) => visibility[id] && api.getPanel(id),
  );
  const sideWidth = desktopSideWidth(api.width, 0.145);

  for (const id of leftPanels) {
    api.getPanel(id)?.api.setSize({
      width: sideWidth,
      height: desktopRowHeight(api.height, 1 / leftPanels.length),
    });
  }
  for (const id of rightPanels) {
    api.getPanel(id)?.api.setSize({
      width: sideWidth,
      height: desktopRowHeight(api.height, 1 / rightPanels.length),
    });
  }
}

function addGraphPanel(api: DockviewApi, title: string) {
  if (api.getPanel(GRAPH_PANEL_ID)) return;
  api.addPanel<DockPanelParams>({
    id: GRAPH_PANEL_ID,
    component: GRAPH_COMPONENT,
    tabComponent: GRAPH_TAB_COMPONENT,
    title,
    params: { panelId: GRAPH_PANEL_ID },
    renderer: "always",
    minimumWidth: 280,
    minimumHeight: 180,
  });
}

function addToolPanel(
  api: DockviewApi,
  id: ContextPanelId,
  options: {
    direction: "above" | "below" | "left" | "right" | "within";
    referencePanel: string;
    initialWidth?: number;
    initialHeight?: number;
    inactive?: boolean;
  },
) {
  if (api.getPanel(id)) return;
  api.addPanel<DockPanelParams>({
    id,
    component: TOOL_COMPONENT,
    tabComponent: TOOL_TAB_COMPONENT,
    title: id,
    params: { panelId: id },
    position: {
      direction: options.direction,
      referencePanel: options.referencePanel,
    },
    initialWidth: options.initialWidth,
    initialHeight: options.initialHeight,
    inactive: options.inactive,
    renderer: "always",
    minimumWidth: 220,
    minimumHeight: 150,
  });
}

function updatePanelTitles(
  api: DockviewApi,
  graphTitle: string,
  panels: Record<ContextPanelId, ContextDockviewPanelDefinition>,
) {
  const graph = api.getPanel(GRAPH_PANEL_ID);
  if (graph && graph.api.title !== graphTitle) graph.api.setTitle(graphTitle);
  for (const id of CONTEXT_PANEL_IDS) {
    const panel = api.getPanel(id);
    if (panel && panel.api.title !== panels[id].title) {
      panel.api.setTitle(panels[id].title);
    }
  }
}

function readSavedLayout(mode: DockviewMode): SerializedDockview | null {
  try {
    const raw = window.localStorage.getItem(storageKey(mode));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isSafeSerializedLayout(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function removeSavedLayout(mode: DockviewMode) {
  try {
    window.localStorage.removeItem(storageKey(mode));
  } catch {
    // Nothing to reset when storage is unavailable.
  }
}

function isSafeSerializedLayout(value: unknown): value is SerializedDockview {
  if (!isRecord(value) || !isRecord(value.grid) || !isRecord(value.panels)) {
    return false;
  }
  const allowedIds = new Set<string>([GRAPH_PANEL_ID, ...CONTEXT_PANEL_IDS]);
  return Object.entries(value.panels).every(([id, panel]) => {
    if (!allowedIds.has(id) || !isRecord(panel)) return false;
    const expectedComponent =
      id === GRAPH_PANEL_ID ? GRAPH_COMPONENT : TOOL_COMPONENT;
    const expectedTab =
      id === GRAPH_PANEL_ID ? GRAPH_TAB_COMPONENT : TOOL_TAB_COMPONENT;
    return (
      panel.id === id &&
      panel.contentComponent === expectedComponent &&
      panel.tabComponent === expectedTab
    );
  });
}

function storageKey(mode: DockviewMode) {
  return mode === "compact" ? COMPACT_LAYOUT_KEY : DESKTOP_LAYOUT_KEY;
}

function readToolPanelId(value: unknown): ContextPanelId | null {
  if (!isRecord(value)) return null;
  return isContextPanelId(value.panelId) ? value.panelId : null;
}

function isContextPanelId(value: unknown): value is ContextPanelId {
  return CONTEXT_PANEL_IDS.includes(value as ContextPanelId);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
