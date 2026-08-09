export const CONTEXT_PANEL_IDS = [
  "transcript",
  "fallacies",
  "facts",
  "topics",
  "neutrality",
] as const;

export type ContextPanelId = (typeof CONTEXT_PANEL_IDS)[number];

export type PanelVisibility = Record<ContextPanelId, boolean>;

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
