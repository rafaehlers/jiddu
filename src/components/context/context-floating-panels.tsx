"use client";

import {
  ChevronDown,
  Eye,
  EyeOff,
  GripHorizontal,
  Minus,
  MoveDiagonal,
  MoveDiagonal2,
  RotateCcw,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import type { ContextCopy } from "./context-copy";
import {
  CONTEXT_PANEL_IDS,
  type ContextPanelId,
  type PanelLayout,
  type PanelLayouts,
  type PanelVisibility,
} from "./context-panel-state";
import { useContextUiStore } from "./context-ui-store-provider";

export { CONTEXT_PANEL_IDS, type ContextPanelId } from "./context-panel-state";

type Bounds = { width: number; height: number };

export type ContextFloatingPanelsState = {
  visibility: PanelVisibility;
  activePanel: ContextPanelId;
  visibleCount: number;
  anyVisible: boolean;
  resetVersion: number;
  toggleAll: () => void;
  togglePanel: (id: ContextPanelId) => void;
  selectPanel: (id: ContextPanelId) => void;
  resetPanels: () => void;
};

export type ContextFloatingPanelDefinition = {
  title: string;
  count?: number;
  toneClass: string;
  content: ReactNode;
  contentClassName?: string;
};

const VIEWPORT_GAP = 12;
const PANEL_HEADER_HEIGHT = 40;
const STACK_GAP = 8;
const MIN_PANEL_WIDTH = 240;
const MIN_PANEL_HEIGHT = 160;

export function useContextFloatingPanels(): ContextFloatingPanelsState {
  const visibility = useContextUiStore((state) => state.visibility);
  const activePanel = useContextUiStore((state) => state.activePanel);
  const resetVersion = useContextUiStore((state) => state.resetVersion);
  const toggleAll = useContextUiStore((state) => state.toggleAllPanels);
  const togglePanel = useContextUiStore((state) => state.togglePanel);
  const selectPanel = useContextUiStore((state) => state.selectPanel);
  const resetPanels = useContextUiStore((state) => state.resetPanels);

  const visibleCount = CONTEXT_PANEL_IDS.filter((id) => visibility[id]).length;
  const anyVisible = visibleCount > 0;

  return {
    visibility,
    activePanel,
    visibleCount,
    anyVisible,
    resetVersion,
    toggleAll,
    togglePanel,
    selectPanel,
    resetPanels,
  };
}

export function ContextPanelsControl({
  state,
  labels,
  copy,
}: {
  state: ContextFloatingPanelsState;
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
          {CONTEXT_PANEL_IDS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={
                compactMode ? state.activePanel === id : state.visibility[id]
              }
              onClick={() => handlePanelAction(id)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-paper"
            >
              {(
                compactMode ? state.activePanel === id : state.visibility[id]
              ) ? (
                <Eye className="size-3.5 text-foreground" />
              ) : (
                <EyeOff className="size-3.5 text-muted" />
              )}
              <span
                className={
                  compactMode || state.visibility[id] ? "" : "text-muted"
                }
              >
                {labels[id]}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={state.resetPanels}
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

export function ContextFloatingPanels({
  state,
  panels,
  copy,
}: {
  state: ContextFloatingPanelsState;
  panels: Record<ContextPanelId, ContextFloatingPanelDefinition>;
  copy: ContextCopy;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appliedResetRef = useRef(0);
  const [bounds, setBounds] = useState<Bounds>({ width: 0, height: 0 });
  const layouts = useContextUiStore((store) => store.layouts);
  const setLayouts = useContextUiStore((store) => store.setLayouts);
  const hydrated = useContextUiStore((store) => store.hydrated);
  const [frontPanel, setFrontPanel] = useState<ContextPanelId>("facts");
  const [compactMode, setCompactMode] = useState(false);
  const [mobileMinimized, setMobileMinimized] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateBounds = () => {
      const rect = container.getBoundingClientRect();
      setBounds((current) =>
        current.width === rect.width && current.height === rect.height
          ? current
          : { width: rect.width, height: rect.height },
      );
    };
    updateBounds();
    const observer = new ResizeObserver(updateBounds);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setCompactMode(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!hydrated || bounds.width <= 0 || bounds.height <= 0) return;
    const resetRequested = state.resetVersion > appliedResetRef.current;
    if (resetRequested) appliedResetRef.current = state.resetVersion;
    setLayouts((current) => {
      const defaults = defaultLayouts(bounds);
      if (resetRequested || !current) return defaults;
      return Object.fromEntries(
        CONTEXT_PANEL_IDS.map((id) => [
          id,
          clampPanelLayout(current[id] ?? defaults[id], bounds),
        ]),
      ) as PanelLayouts;
    });
  }, [bounds, hydrated, setLayouts, state.resetVersion]);

  const updatePanel = useCallback(
    (id: ContextPanelId, update: (layout: PanelLayout) => PanelLayout) => {
      setLayouts((current) =>
        current
          ? {
              ...current,
              [id]: clampPanelLayout(update(current[id]), bounds),
            }
          : current,
      );
    },
    [bounds, setLayouts],
  );

  const startMove = useCallback(
    (id: ContextPanelId, event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || !layouts) return;
      event.preventDefault();
      event.stopPropagation();
      setFrontPanel(id);
      const startX = event.clientX;
      const startY = event.clientY;
      const initial = layouts[id];
      beginPointerDrag("move", (moveEvent) => {
        updatePanel(id, (current) => ({
          ...current,
          x: initial.x + moveEvent.clientX - startX,
          y: initial.y + moveEvent.clientY - startY,
        }));
      });
    },
    [layouts, updatePanel],
  );

  const startResize = useCallback(
    (
      id: ContextPanelId,
      corner: "southwest" | "southeast",
      event: ReactPointerEvent<HTMLButtonElement>,
    ) => {
      if (event.button !== 0 || !layouts) return;
      event.preventDefault();
      event.stopPropagation();
      setFrontPanel(id);
      const startX = event.clientX;
      const startY = event.clientY;
      const initial = layouts[id];
      beginPointerDrag(
        corner === "southwest" ? "sw-resize" : "se-resize",
        (moveEvent) => {
          const deltaX = moveEvent.clientX - startX;
          const deltaY = moveEvent.clientY - startY;
          if (corner === "southwest") {
            const maximumWidth = Math.max(160, bounds.width - VIEWPORT_GAP * 2);
            const minimumWidth = Math.min(MIN_PANEL_WIDTH, maximumWidth);
            const width = clamp(
              initial.width - deltaX,
              minimumWidth,
              maximumWidth,
            );
            updatePanel(id, (current) => ({
              ...current,
              x: initial.x + initial.width - width,
              width,
              height: initial.height + deltaY,
            }));
            return;
          }
          updatePanel(id, (current) => ({
            ...current,
            width: initial.width + deltaX,
            height: initial.height + deltaY,
          }));
        },
      );
    },
    [bounds.width, layouts, updatePanel],
  );

  const activeMobilePanel = state.visibility[state.activePanel]
    ? state.activePanel
    : (CONTEXT_PANEL_IDS.find((id) => state.visibility[id]) ??
      state.activePanel);
  const mobileDefinition = panels[activeMobilePanel];

  return (
    <div
      ref={containerRef}
      aria-label={copy.panels}
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      {compactMode && state.anyVisible ? (
        <section
          aria-label={mobileDefinition.title}
          className="nodrag nopan nowheel pointer-events-auto absolute inset-x-2 bottom-2 z-50 flex min-h-0 flex-col overflow-hidden rounded-xl border border-rule bg-background/95 shadow-2xl backdrop-blur-md"
          style={{
            height: mobileMinimized ? PANEL_HEADER_HEIGHT : "min(55%, 24rem)",
          }}
        >
          <div className="flex h-10 shrink-0 items-center gap-2 border-b border-rule bg-paper/90 px-2.5">
            <span
              className={`size-1.5 shrink-0 rounded-full ${mobileDefinition.toneClass}`}
            />
            <select
              aria-label={copy.panelSettings}
              value={activeMobilePanel}
              onChange={(event) =>
                state.selectPanel(event.target.value as ContextPanelId)
              }
              className="min-w-0 flex-1 bg-transparent text-[11px] font-semibold uppercase tracking-wider outline-none"
            >
              {CONTEXT_PANEL_IDS.filter((id) => state.visibility[id]).map(
                (id) => (
                  <option key={id} value={id}>
                    {panels[id].title}
                  </option>
                ),
              )}
            </select>
            {mobileDefinition.count !== undefined ? (
              <span className="rounded-full bg-background px-1.5 py-0.5 text-[9px] tabular-nums text-muted">
                {mobileDefinition.count}
              </span>
            ) : null}
            <button
              type="button"
              aria-label={
                mobileMinimized ? copy.restorePanel : copy.minimizePanel
              }
              title={mobileMinimized ? copy.restorePanel : copy.minimizePanel}
              onClick={() => setMobileMinimized((current) => !current)}
              className="grid size-6 place-items-center rounded text-muted hover:bg-foreground/10 hover:text-foreground"
            >
              {mobileMinimized ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <Minus className="size-3.5" />
              )}
            </button>
            <button
              type="button"
              aria-label={copy.hidePanel}
              title={copy.hidePanel}
              onClick={() => state.togglePanel(activeMobilePanel)}
              className="grid size-6 place-items-center rounded text-muted hover:bg-foreground/10 hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
          {!mobileMinimized ? (
            <div
              className={`min-h-0 flex-1 ${mobileDefinition.contentClassName ?? "overflow-y-auto p-3"}`}
            >
              {mobileDefinition.content}
            </div>
          ) : null}
        </section>
      ) : null}
      {!compactMode && layouts
        ? CONTEXT_PANEL_IDS.map((id, index) => {
            if (!state.visibility[id]) return null;
            const panel = panels[id];
            const layout = layouts[id];
            const height = layout.minimized
              ? PANEL_HEADER_HEIGHT
              : layout.height;
            return (
              <section
                key={id}
                aria-label={panel.title}
                className="nodrag nopan nowheel pointer-events-auto absolute flex min-h-0 flex-col overflow-hidden rounded-xl border border-rule bg-background/95 shadow-2xl backdrop-blur-md"
                style={{
                  left: layout.x,
                  top: layout.y,
                  width: layout.width,
                  height,
                  zIndex: frontPanel === id ? 40 : 25 + index,
                }}
                onPointerDown={() => setFrontPanel(id)}
              >
                <div
                  className="flex h-10 shrink-0 cursor-move touch-none items-center gap-2 border-b border-rule bg-paper/90 px-2.5"
                  onPointerDown={(event) => startMove(id, event)}
                >
                  <GripHorizontal className="size-3.5 shrink-0 text-muted" />
                  <span
                    className={`size-1.5 shrink-0 rounded-full ${panel.toneClass}`}
                  />
                  <h2 className="truncate text-[11px] font-semibold uppercase tracking-wider">
                    {panel.title}
                  </h2>
                  {panel.count !== undefined ? (
                    <span className="rounded-full bg-background px-1.5 py-0.5 text-[9px] tabular-nums text-muted">
                      {panel.count}
                    </span>
                  ) : null}
                  <div className="ml-auto flex items-center gap-0.5">
                    <button
                      type="button"
                      aria-label={
                        layout.minimized
                          ? copy.restorePanel
                          : copy.minimizePanel
                      }
                      title={
                        layout.minimized
                          ? copy.restorePanel
                          : copy.minimizePanel
                      }
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() =>
                        updatePanel(id, (current) => ({
                          ...current,
                          minimized: !current.minimized,
                        }))
                      }
                      className="grid size-6 place-items-center rounded text-muted hover:bg-foreground/10 hover:text-foreground"
                    >
                      {layout.minimized ? (
                        <ChevronDown className="size-3.5" />
                      ) : (
                        <Minus className="size-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      aria-label={copy.hidePanel}
                      title={copy.hidePanel}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => state.togglePanel(id)}
                      className="grid size-6 place-items-center rounded text-muted hover:bg-foreground/10 hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
                {!layout.minimized ? (
                  <div
                    className={`min-h-0 flex-1 ${panel.contentClassName ?? "overflow-y-auto p-3"}`}
                  >
                    {panel.content}
                  </div>
                ) : null}
                {!layout.minimized ? (
                  <>
                    <button
                      type="button"
                      aria-label={copy.resizePanelLeft}
                      title={copy.resizePanelLeft}
                      onPointerDown={(event) =>
                        startResize(id, "southwest", event)
                      }
                      className="absolute bottom-1 left-1 grid size-6 cursor-sw-resize touch-none place-items-center rounded-md border border-rule bg-background/85 text-muted shadow-sm transition-colors hover:border-accent hover:text-accent"
                    >
                      <MoveDiagonal className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={copy.resizePanel}
                      title={copy.resizePanel}
                      onPointerDown={(event) =>
                        startResize(id, "southeast", event)
                      }
                      className="absolute bottom-1 right-1 grid size-6 cursor-se-resize touch-none place-items-center rounded-md border border-rule bg-background/85 text-muted shadow-sm transition-colors hover:border-accent hover:text-accent"
                    >
                      <MoveDiagonal2 className="size-3.5" />
                    </button>
                  </>
                ) : null}
              </section>
            );
          })
        : null}
    </div>
  );
}

function defaultLayouts(bounds: Bounds): PanelLayouts {
  const width = clamp(bounds.width * 0.27, MIN_PANEL_WIDTH, 360);
  const expandedHeight = clamp(bounds.height * 0.4, 190, 320);
  const top = 54;

  return Object.fromEntries(
    CONTEXT_PANEL_IDS.map((id, index) => [
      id,
      clampPanelLayout(
        panelLayout(
          VIEWPORT_GAP,
          top + index * (PANEL_HEADER_HEIGHT + STACK_GAP),
          width,
          expandedHeight,
          true,
        ),
        bounds,
      ),
    ]),
  ) as PanelLayouts;
}

function panelLayout(
  x: number,
  y: number,
  width: number,
  height: number,
  minimized = false,
): PanelLayout {
  return { x, y, width, height, minimized };
}

function clampPanelLayout(layout: PanelLayout, bounds: Bounds): PanelLayout {
  const maxWidth = Math.max(160, bounds.width - VIEWPORT_GAP * 2);
  const maxHeight = Math.max(120, bounds.height - VIEWPORT_GAP * 2);
  const minimumWidth = Math.min(MIN_PANEL_WIDTH, maxWidth);
  const minimumHeight = Math.min(MIN_PANEL_HEIGHT, maxHeight);
  const width = clamp(layout.width, minimumWidth, maxWidth);
  const height = clamp(layout.height, minimumHeight, maxHeight);
  const visibleHeight = layout.minimized ? PANEL_HEADER_HEIGHT : height;
  return {
    ...layout,
    x: clamp(
      layout.x,
      VIEWPORT_GAP,
      Math.max(VIEWPORT_GAP, bounds.width - width - VIEWPORT_GAP),
    ),
    y: clamp(
      layout.y,
      VIEWPORT_GAP,
      Math.max(VIEWPORT_GAP, bounds.height - visibleHeight - VIEWPORT_GAP),
    ),
    width,
    height,
  };
}

function beginPointerDrag(
  cursor: "move" | "se-resize" | "sw-resize",
  onMove: (event: PointerEvent) => void,
) {
  const previousCursor = document.body.style.cursor;
  const previousUserSelect = document.body.style.userSelect;
  document.body.style.cursor = cursor;
  document.body.style.userSelect = "none";

  const finish = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", finish);
    window.removeEventListener("pointercancel", finish);
    document.body.style.cursor = previousCursor;
    document.body.style.userSelect = previousUserSelect;
  };

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", finish, { once: true });
  window.addEventListener("pointercancel", finish, { once: true });
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}
