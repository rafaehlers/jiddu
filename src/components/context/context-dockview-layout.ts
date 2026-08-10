import type {
  ContextPanelId,
  PanelVisibility,
} from "./context-panel-state";

export type ContextDockviewPlacement = {
  id: ContextPanelId;
  direction: "above" | "below" | "left" | "right";
  referencePanel: string;
  initialWidthRatio?: number;
  initialHeightRatio?: number;
};

const LEFT_PANEL_ORDER = ["transcript", "topics"] as const;
const RIGHT_PANEL_ORDER = ["facts", "neutrality", "fallacies"] as const;

export function planDefaultDesktopLayout(
  visibility: PanelVisibility,
  graphPanelId: string,
): ContextDockviewPlacement[] {
  return [
    ...planVerticalFamily(LEFT_PANEL_ORDER, "left", visibility, graphPanelId),
    ...planVerticalFamily(
      RIGHT_PANEL_ORDER,
      "right",
      visibility,
      graphPanelId,
    ),
  ];
}

function planVerticalFamily(
  order: readonly ContextPanelId[],
  side: "left" | "right",
  visibility: PanelVisibility,
  graphPanelId: string,
): ContextDockviewPlacement[] {
  const visible = order.filter((id) => visibility[id]);
  const first = visible[0];
  if (!first) return [];

  const placements: ContextDockviewPlacement[] = [
    {
      id: first,
      direction: side,
      referencePanel: graphPanelId,
      initialWidthRatio: 0.145,
    },
  ];
  // Add rows from top to bottom. Each new row claims its final fraction of
  // the whole column (1/2, then 1/3), while Dockview scales earlier rows.
  for (let index = 1; index < visible.length; index += 1) {
    placements.push({
      id: visible[index],
      direction: "below",
      referencePanel: visible[index - 1],
      initialHeightRatio: 1 / (index + 1),
    });
  }
  return placements;
}
