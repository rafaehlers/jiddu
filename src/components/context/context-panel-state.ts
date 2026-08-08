export const CONTEXT_PANEL_IDS = [
  "transcript",
  "fallacies",
  "facts",
  "topics",
  "neutrality",
] as const;

export type ContextPanelId = (typeof CONTEXT_PANEL_IDS)[number];

export type PanelVisibility = Record<ContextPanelId, boolean>;

export type PanelLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
};

export type PanelLayouts = Record<ContextPanelId, PanelLayout>;

export const ALL_PANELS_VISIBLE: PanelVisibility = {
  transcript: true,
  fallacies: true,
  facts: true,
  topics: true,
  neutrality: true,
};

export function normalizePanelVisibility(value: unknown): PanelVisibility {
  const record = isRecord(value) ? value : {};
  return Object.fromEntries(
    CONTEXT_PANEL_IDS.map((id) => [id, record[id] !== false]),
  ) as PanelVisibility;
}

export function normalizePanelLayouts(value: unknown): PanelLayouts | null {
  if (!isRecord(value)) return null;
  if (!CONTEXT_PANEL_IDS.every((id) => isPanelLayout(value[id]))) return null;
  return Object.fromEntries(
    CONTEXT_PANEL_IDS.map((id) => [id, { ...value[id] as PanelLayout }]),
  ) as PanelLayouts;
}

function isPanelLayout(value: unknown): value is PanelLayout {
  if (!isRecord(value)) return false;
  return (
    Number.isFinite(value.x) &&
    Number.isFinite(value.y) &&
    Number.isFinite(value.width) &&
    Number.isFinite(value.height) &&
    typeof value.minimized === "boolean"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
