"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  Position,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";

export type ContextRelationEdgeData = Record<string, unknown> & {
  relations: Array<{ id: string; label: string }>;
  relationsLabel: string;
  selectedRelationId: string | null;
  onSelectRelation: (relationId: string) => void;
  reciprocalLabelOffset: number;
};

export type ContextRelationEdge = Edge<
  ContextRelationEdgeData,
  "contextRelation"
>;

export function ContextRelationEdgeView({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}: EdgeProps<ContextRelationEdge>) {
  const [edgePath, labelX, labelY] = data?.reciprocalLabelOffset
    ? getReciprocalRelationPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        labelOffset: data.reciprocalLabelOffset,
      })
    : getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
      });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={style}
      />
      {data?.relations.length ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-auto absolute flex max-w-72 flex-col overflow-hidden rounded-md border border-rule bg-background/95 shadow-md backdrop-blur"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {data.relations.length > 1 ? (
              <span className="border-b border-rule px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-muted">
                {data.relations.length} {data.relationsLabel}
              </span>
            ) : null}
            {data.relations.map((relation) => {
              const selected = data.selectedRelationId === relation.id;
              return (
                <button
                  key={relation.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={(event) => {
                    event.stopPropagation();
                    data.onSelectRelation(relation.id);
                  }}
                  onDoubleClick={(event) => event.stopPropagation()}
                  className={`px-2.5 py-1.5 text-left text-[11px] font-semibold leading-snug transition-colors ${
                    selected
                      ? "bg-accent/15 text-accent"
                      : "text-foreground hover:bg-foreground/5 hover:text-accent"
                  }`}
                >
                  {relation.label}
                </button>
              );
            })}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

type ReciprocalPathInput = {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  labelOffset: number;
};

function getReciprocalRelationPath({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  labelOffset,
}: ReciprocalPathInput): [string, number, number] {
  const deltaX = targetX - sourceX;
  const deltaY = targetY - sourceY;
  const distance = Math.hypot(deltaX, deltaY);
  if (distance < 1) {
    const [path, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    });
    return [path, labelX, labelY];
  }

  // Both reciprocal edges use the same positive displacement relative to
  // their own source→target vector. Reversing the edge reverses this normal,
  // so A→B and B→A curve naturally to opposite sides of the entity pair.
  const normalX = -deltaY / distance;
  const normalY = deltaX / distance;
  const controlShift = labelOffset / 0.75;
  const controlDistance = Math.min(90, Math.max(42, distance * 0.2));
  const sourceDirection = handleDirection(sourcePosition);
  const targetDirection = handleDirection(targetPosition);
  const sourceControlX =
    sourceX +
    sourceDirection.x * controlDistance +
    normalX * controlShift;
  const sourceControlY =
    sourceY +
    sourceDirection.y * controlDistance +
    normalY * controlShift;
  const targetControlX =
    targetX +
    targetDirection.x * controlDistance +
    normalX * controlShift;
  const targetControlY =
    targetY +
    targetDirection.y * controlDistance +
    normalY * controlShift;

  const labelX =
    sourceX * 0.125 +
    sourceControlX * 0.375 +
    targetControlX * 0.375 +
    targetX * 0.125;
  const labelY =
    sourceY * 0.125 +
    sourceControlY * 0.375 +
    targetControlY * 0.375 +
    targetY * 0.125;

  return [
    `M${sourceX},${sourceY} C${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${targetX},${targetY}`,
    labelX,
    labelY,
  ];
}

function handleDirection(position: Position): { x: number; y: number } {
  switch (position) {
    case Position.Left:
      return { x: -1, y: 0 };
    case Position.Right:
      return { x: 1, y: 0 };
    case Position.Top:
      return { x: 0, y: -1 };
    case Position.Bottom:
      return { x: 0, y: 1 };
  }
}
