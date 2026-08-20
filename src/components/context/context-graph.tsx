"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  type Edge,
  type EdgeChange,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type {
  KnowledgeEntityDTO,
  KnowledgeRelationDTO,
} from "@/lib/context-knowledge-schema";
import type {
  LiveContext,
  LiveContextEntityKind,
} from "@/lib/live-context-schema";
import { groupContextRelations } from "@/lib/context-relation-groups";
import type { ContextCopy } from "./context-copy";
import { ContextEntityNodeCard, type ContextEntityNode } from "./entity-node";
import {
  ContextRelationEdgeView,
  type ContextRelationEdge,
} from "./context-relation-edge";

const nodeTypes = { contextEntity: ContextEntityNodeCard };
const edgeTypes = { contextRelation: ContextRelationEdgeView };
const KIND_COLUMN: Record<LiveContextEntityKind, number> = {
  person: 0,
  organization: 1,
  institution: 1,
  country: 2,
  event: 2,
};

type Props = {
  context: LiveContext;
  enrichedEntities?: ReadonlyMap<string, KnowledgeEntityDTO>;
  enrichedRelations?: ReadonlyMap<string, KnowledgeRelationDTO>;
  copy: ContextCopy;
  onJumpToSentence?: (sentenceId: string) => void;
  editable?: boolean;
  onRenameEntity?: (entityId: string, name: string) => Promise<void>;
  onMergeEntities?: (
    sourceEntityId: string,
    targetEntityId: string,
  ) => Promise<void>;
  onRemoveEntity?: (entityId: string) => Promise<void>;
  colorMode?: "dark" | "light";
  showMiniMap?: boolean;
  animateRelations?: boolean;
};

export function ContextGraph(props: Props) {
  return (
    <ReactFlowProvider>
      <ContextGraphInner {...props} />
    </ReactFlowProvider>
  );
}

function ContextGraphInner({
  context,
  enrichedEntities = new Map(),
  enrichedRelations = new Map(),
  copy,
  onJumpToSentence,
  editable = false,
  onRenameEntity,
  onMergeEntities,
  onRemoveEntity,
  colorMode = "dark",
  showMiniMap = true,
  animateRelations = true,
}: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<ContextEntityNode>([]);
  const [edges, setEdges, onEdgesChange] =
    useEdgesState<ContextRelationEdge>([]);
  const [selectedRelationId, setSelectedRelationId] = useState<string | null>(
    null,
  );
  const nodeIdentity = nodes
    .map((node) => node.id)
    .sort()
    .join("\u0000");
  const edgeIdentity = edges
    .map((edge) => edge.id)
    .sort()
    .join("\u0000");

  const handleNodesChange = useCallback(
    (changes: NodeChange<ContextEntityNode>[]) => {
      // Context data is the only structural source of truth. React Flow may
      // update position, dimensions and selection, but it must never add,
      // replace or remove generated entity cards on its own.
      onNodesChange(
        changes.filter(
          (change) =>
            change.type === "position" ||
            change.type === "dimensions" ||
            change.type === "select",
        ),
      );
    },
    [onNodesChange],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange<ContextRelationEdge>[]) => {
      onEdgesChange(changes.filter((change) => change.type === "select"));
    },
    [onEdgesChange],
  );

  const handleSelectRelation = useCallback((relationId: string) => {
    setSelectedRelationId(relationId);
  }, []);

  useEffect(() => {
    setNodes((current) => {
      const previous = new Map(current.map((node) => [node.id, node]));
      const kindCounts = new Map<LiveContextEntityKind, number>();
      return context.entities.map((entity) => {
        const existing = previous.get(entity.id);
        const kindIndex = kindCounts.get(entity.kind) ?? 0;
        kindCounts.set(entity.kind, kindIndex + 1);
        return {
          // React Flow stores measurements and drag state on the controlled
          // node. Keep that state when profiles or incremental context data
          // refresh; dropping it can temporarily make existing nodes look
          // uninitialized or disappear from the current viewport.
          ...existing,
          id: entity.id,
          type: "contextEntity",
          position:
            existing?.position ?? positionForEntity(entity.kind, kindIndex),
          selected: existing?.selected,
          data: {
            entity,
            enriched: enrichedEntities.get(entity.id) ?? null,
            copy,
            onJumpToSentence,
            editable,
            mergeCandidates: context.entities.filter(
              (candidate) =>
                candidate.id !== entity.id && candidate.kind === entity.kind,
            ),
            onRenameEntity,
            onMergeEntities,
            onRemoveEntity,
          },
        };
      });
    });
  }, [
    context.entities,
    copy,
    editable,
    enrichedEntities,
    onJumpToSentence,
    onMergeEntities,
    onRemoveEntity,
    onRenameEntity,
    nodeIdentity,
    setNodes,
  ]);

  useEffect(() => {
    setEdges(
      groupContextRelations(context.relations).map((group) => ({
        id: group.id,
        source: group.sourceEntityId,
        target: group.targetEntityId,
        type: "contextRelation",
        animated:
          animateRelations &&
          group.relations.some((relation) => relation.importance >= 0.82),
        markerEnd: { type: MarkerType.ArrowClosed, color: "var(--muted)" },
        style: {
          stroke: group.relations.some(
            (relation) => relation.id === selectedRelationId,
          )
            ? "var(--accent)"
            : "var(--muted)",
          strokeWidth: 1.5,
        },
        data: {
          relations: group.relations.map((relation) => ({
            id: relation.id,
            label: relation.label,
          })),
          relationsLabel: copy.relations,
          selectedRelationId,
          onSelectRelation: handleSelectRelation,
          reciprocalLabelOffset: group.reciprocalLabelOffset,
        },
      })),
    );
  }, [
    animateRelations,
    context.relations,
    copy.relations,
    edgeIdentity,
    handleSelectRelation,
    selectedRelationId,
    setEdges,
  ]);

  const selectedRelation = useMemo(
    () =>
      context.relations.find(
        (relation) => relation.id === selectedRelationId,
      ) ?? null,
    [context.relations, selectedRelationId],
  );
  const enrichedRelation = selectedRelation
    ? (enrichedRelations.get(selectedRelation.id) ?? null)
    : null;
  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      const firstRelation = (edge as ContextRelationEdge).data?.relations[0];
      setSelectedRelationId(firstRelation?.id ?? null);
    },
    [],
  );

  if (context.entities.length === 0) {
    return (
      <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_center,var(--rule)_1px,transparent_1px)] [background-size:22px_22px]">
        <div className="max-w-sm rounded-xl border border-dashed border-rule bg-background/80 px-6 py-8 text-center backdrop-blur">
          <p className="font-serif text-xl">{copy.noEntities}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {copy.graphEmpty}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onEdgeClick={handleEdgeClick}
        onPaneClick={() => setSelectedRelationId(null)}
        fitView
        fitViewOptions={{ padding: 0.25, maxZoom: 0.9 }}
        minZoom={0.25}
        maxZoom={1.5}
        zoomOnDoubleClick={false}
        deleteKeyCode={null}
        colorMode={colorMode}
        proOptions={{ hideAttribution: false }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1}
          color="var(--rule)"
        />
        <Controls position="bottom-left" />
        {showMiniMap ? (
          <MiniMap
            position="bottom-right"
            pannable
            zoomable
            nodeColor="var(--accent)"
            bgColor="var(--paper)"
            maskColor="color-mix(in oklab, var(--background) 75%, transparent)"
          />
        ) : null}
      </ReactFlow>

      {selectedRelation ? (
        <aside className="absolute bottom-4 left-1/2 z-10 w-[min(30rem,calc(100%-2rem))] -translate-x-1/2 rounded-xl border border-rule bg-background/95 p-4 shadow-2xl backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                {copy.relation}
              </p>
              <p className="mt-1 font-serif text-lg font-semibold">
                {selectedRelation.label}
              </p>
            </div>
            <span className="shrink-0 text-[10px] text-muted">
              {Math.round(selectedRelation.confidence * 100)}% {copy.confidence}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            {selectedRelation.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {selectedRelation.sentenceIds[0] && onJumpToSentence ? (
              <button
                type="button"
                className="text-xs font-medium text-accent hover:underline"
                onClick={() =>
                  onJumpToSentence(selectedRelation.sentenceIds[0])
                }
              >
                {copy.goToPassage}
              </button>
            ) : null}
          </div>
          {enrichedRelation?.sources.length ? (
            <div className="mt-3 border-t border-rule pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                {copy.recentCoverage}
              </p>
              <ul className="mt-1 space-y-1">
                {enrichedRelation.sources.map((source) => (
                  <li key={source.id}>
                    <a
                      className="text-xs text-foreground/80 hover:text-accent hover:underline"
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {source.title}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] text-muted">
                {copy.relatedNotProof}
              </p>
            </div>
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}

function positionForEntity(kind: LiveContextEntityKind, index: number) {
  const column = KIND_COLUMN[kind];
  return {
    x: column * 440 + (kind === "institution" || kind === "event" ? 70 : 0),
    y: index * 390 + (column % 2 === 0 ? 0 : 130),
  };
}
