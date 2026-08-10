import assert from "node:assert/strict";
import test from "node:test";
import { ALL_PANELS_VISIBLE } from "./context-panel-state";
import { planDefaultDesktopLayout } from "./context-dockview-layout";

test("plans the requested three-column Context layout", () => {
  const placements = planDefaultDesktopLayout(
    ALL_PANELS_VISIBLE,
    "context-graph",
  );

  assert.deepEqual(placements, [
    {
      id: "transcript",
      direction: "left",
      referencePanel: "context-graph",
      initialWidthRatio: 0.145,
    },
    {
      id: "topics",
      direction: "below",
      referencePanel: "transcript",
      initialHeightRatio: 0.5,
    },
    {
      id: "facts",
      direction: "right",
      referencePanel: "context-graph",
      initialWidthRatio: 0.145,
    },
    {
      id: "neutrality",
      direction: "below",
      referencePanel: "facts",
      initialHeightRatio: 0.5,
    },
    {
      id: "fallacies",
      direction: "below",
      referencePanel: "neutrality",
      initialHeightRatio: 1 / 3,
    },
  ]);
});

test("keeps the vertical order when some panels are hidden", () => {
  const placements = planDefaultDesktopLayout(
    {
      transcript: false,
      topics: true,
      facts: false,
      neutrality: true,
      fallacies: true,
    },
    "context-graph",
  );

  assert.deepEqual(
    placements.map(({ id, direction, referencePanel }) => ({
      id,
      direction,
      referencePanel,
    })),
    [
      {
        id: "topics",
        direction: "left",
        referencePanel: "context-graph",
      },
      {
        id: "neutrality",
        direction: "right",
        referencePanel: "context-graph",
      },
      {
        id: "fallacies",
        direction: "below",
        referencePanel: "neutrality",
      },
    ],
  );
});
