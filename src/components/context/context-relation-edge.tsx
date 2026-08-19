"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";

export type ContextRelationEdgeData = Record<string, unknown> & {
  relations: Array<{ id: string; label: string }>;
  relationsLabel: string;
  selectedRelationId: string | null;
  onSelectRelation: (relationId: string) => void;
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
  const [edgePath, labelX, labelY] = getSmoothStepPath({
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
