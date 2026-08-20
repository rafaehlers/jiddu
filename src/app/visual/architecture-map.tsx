"use client";

import Link from "next/link";
import {
  Pause,
  Play,
  RotateCcw,
  Search,
  StepForward,
} from "lucide-react";
import {
  Controls,
  Handle,
  MarkerType,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import "@xyflow/react/dist/style.css";
import {
  ARCHITECTURE_EDGES,
  ARCHITECTURE_NODES,
  CODEBASE_STATS,
  DOMAINS,
  SYSTEM_OVERVIEW,
  TRACE_PATH,
  type ArchitectureNodeDefinition,
  type DomainId,
} from "./architecture-data";
import styles from "./visual.module.css";

type TraceState = "idle" | "visited" | "current";

type ArchitectureNodeData = Record<string, unknown> & {
  item: ArchitectureNodeDefinition;
  dimmed: boolean;
  related: boolean;
  traceState: TraceState;
};

type ArchitectureFlowNode = Node<ArchitectureNodeData, "architecture">;

const nodeTypes = { architecture: ArchitectureBlock };
const domainById = new Map(DOMAINS.map((domain) => [domain.id, domain]));
const itemById = new Map(ARCHITECTURE_NODES.map((item) => [item.id, item]));

function ArchitectureBlock({
  data,
  selected,
}: NodeProps<ArchitectureFlowNode>) {
  const { item, dimmed, related, traceState } = data;

  return (
    <article
      className={`${styles.nodeCard} ${
        item.size === "large" ? styles.nodeLarge : ""
      } ${selected ? styles.nodeSelected : ""} ${
        dimmed ? styles.nodeDimmed : ""
      } ${related ? styles.nodeRelated : ""} ${
        traceState === "current"
          ? styles.nodeTraceCurrent
          : traceState === "visited"
            ? styles.nodeTraceVisited
            : ""
      }`}
      data-domain={item.domain}
    >
      <Handle
        type="target"
        position={Position.Left}
        className={styles.handle}
      />
      <span className={styles.nodeCode}>{item.code}</span>
      <span className={styles.nodeTitle}>{item.title}</span>
      <span className={styles.nodeDomain}>
        {domainById.get(item.domain)?.code}
      </span>
      <Handle
        type="source"
        position={Position.Right}
        className={styles.handle}
      />
    </article>
  );
}

export function ArchitectureMap() {
  return (
    <ReactFlowProvider>
      <ArchitectureMapInner />
    </ReactFlowProvider>
  );
}

function ArchitectureMapInner() {
  const { fitView } = useReactFlow<ArchitectureFlowNode, Edge>();
  const [query, setQuery] = useState("");
  const [activeDomain, setActiveDomain] = useState<DomainId | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"what" | "how">("what");
  const [traceIndex, setTraceIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");

  const matchedIds = useMemo(() => {
    if (!normalizedQuery) {
      return new Set(ARCHITECTURE_NODES.map((item) => item.id));
    }

    return new Set(
      ARCHITECTURE_NODES.filter((item) =>
        [item.code, item.title, item.eyebrow, item.summary, ...item.files]
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedQuery),
      ).map((item) => item.id),
    );
  }, [normalizedQuery]);

  const relatedIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const ids = new Set<string>();
    for (const edge of ARCHITECTURE_EDGES) {
      if (edge.source === selectedNodeId) ids.add(edge.target);
      if (edge.target === selectedNodeId) ids.add(edge.source);
    }
    return ids;
  }, [selectedNodeId]);

  const activeNodeIds = useMemo(
    () =>
      new Set(
        ARCHITECTURE_NODES.filter(
          (item) =>
            matchedIds.has(item.id) &&
            (activeDomain === null || item.domain === activeDomain),
        ).map((item) => item.id),
      ),
    [activeDomain, matchedIds],
  );

  const nodes = useMemo<ArchitectureFlowNode[]>(
    () =>
      ARCHITECTURE_NODES.map((item) => {
        const tracePosition = TRACE_PATH.indexOf(
          item.id as (typeof TRACE_PATH)[number],
        );
        const traceState: TraceState =
          tracePosition === traceIndex
            ? "current"
            : tracePosition >= 0 && tracePosition < traceIndex
              ? "visited"
              : "idle";

        return {
          id: item.id,
          type: "architecture",
          position: item.position,
          data: {
            item,
            dimmed: !activeNodeIds.has(item.id),
            related: relatedIds.has(item.id),
            traceState,
          },
          selected: selectedNodeId === item.id,
          draggable: false,
          selectable: true,
          ariaLabel: `${item.title}: ${item.eyebrow}`,
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          zIndex:
            selectedNodeId === item.id || traceState === "current" ? 4 : 2,
        };
      }),
    [activeNodeIds, relatedIds, selectedNodeId, traceIndex],
  );

  const traceEdgeIds = useMemo(() => {
    const ids = new Set<string>();
    for (let index = 1; index <= traceIndex; index += 1) {
      ids.add(`${TRACE_PATH[index - 1]}->${TRACE_PATH[index]}`);
    }
    return ids;
  }, [traceIndex]);

  const edges = useMemo<Edge[]>(
    () =>
      ARCHITECTURE_EDGES.map((definition) => {
        const id = `${definition.source}->${definition.target}`;
        const isTraced = traceEdgeIds.has(id);
        const isCurrentTrace =
          traceIndex > 0 &&
          definition.source === TRACE_PATH[traceIndex - 1] &&
          definition.target === TRACE_PATH[traceIndex];
        const isSelected =
          definition.source === selectedNodeId ||
          definition.target === selectedNodeId;
        const isDimmed =
          !activeNodeIds.has(definition.source) ||
          !activeNodeIds.has(definition.target);
        const stroke =
          isTraced || isSelected
            ? "var(--atlas-accent)"
            : "var(--atlas-line)";

        return {
          id,
          source: definition.source,
          target: definition.target,
          type: "smoothstep",
          animated: isCurrentTrace,
          selectable: false,
          focusable: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: stroke,
            width: 12,
            height: 12,
          },
          style: {
            stroke,
            strokeWidth: isTraced || isSelected ? 2 : 1.2,
            strokeDasharray: definition.role === "support" ? "5 5" : undefined,
            opacity: isDimmed ? 0.08 : definition.role === "support" ? 0.46 : 0.72,
          },
        };
      }),
    [activeNodeIds, selectedNodeId, traceEdgeIds, traceIndex],
  );

  const selectedNode = selectedNodeId
    ? (itemById.get(selectedNodeId) ?? null)
    : null;
  const selectedDomain = activeDomain
    ? (domainById.get(activeDomain) ?? null)
    : null;

  const connectedNodes = useMemo(() => {
    if (!selectedNodeId) return [];
    const ids = new Set<string>();
    for (const edge of ARCHITECTURE_EDGES) {
      if (edge.source === selectedNodeId) ids.add(edge.target);
      if (edge.target === selectedNodeId) ids.add(edge.source);
    }
    return [...ids]
      .map((id) => itemById.get(id))
      .filter((item): item is ArchitectureNodeDefinition => Boolean(item));
  }, [selectedNodeId]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setTraceIndex((current) => (current + 1) % TRACE_PATH.length);
    }, 1200);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  useEffect(() => {
    if (traceIndex < 0) return;
    setSelectedNodeId(TRACE_PATH[traceIndex]);
    setActiveDomain(null);
  }, [traceIndex]);

  useEffect(() => {
    setDetailTab("what");
  }, [activeDomain, selectedNodeId]);

  const selectNode = useCallback((id: string) => {
    setSelectedNodeId(id);
    setActiveDomain(null);
    setIsPlaying(false);
  }, []);

  const selectDomain = useCallback((domain: DomainId | null) => {
    setActiveDomain(domain);
    setSelectedNodeId(null);
    setIsPlaying(false);
    setTraceIndex(-1);
  }, []);

  const toggleTrace = useCallback(() => {
    if (!isPlaying && traceIndex < 0) setTraceIndex(0);
    setIsPlaying((current) => !current);
  }, [isPlaying, traceIndex]);

  const traceOneStep = useCallback(() => {
    setIsPlaying(false);
    setTraceIndex((current) => (current + 1) % TRACE_PATH.length);
  }, []);

  const reset = useCallback(() => {
    setQuery("");
    setActiveDomain(null);
    setSelectedNodeId(null);
    setTraceIndex(-1);
    setIsPlaying(false);
    void fitView({ padding: 0.12, maxZoom: 0.74, duration: 450 });
  }, [fitView]);

  const detailEyebrow = selectedNode
    ? selectedNode.eyebrow
    : selectedDomain
      ? `${selectedDomain.code} · ${selectedDomain.label}`
      : SYSTEM_OVERVIEW.eyebrow;
  const detailTitle = selectedNode
    ? selectedNode.title
    : selectedDomain
      ? selectedDomain.label
      : SYSTEM_OVERVIEW.title;
  const detailSummary = selectedNode
    ? selectedNode.summary
    : selectedDomain
      ? selectedDomain.summary
      : SYSTEM_OVERVIEW.summary;
  const detailImplementation = selectedNode
    ? selectedNode.implementation
    : selectedDomain
      ? selectedDomain.implementation
      : SYSTEM_OVERVIEW.implementation;

  return (
    <main className={styles.atlas}>
      <header className={styles.topbar}>
        <Link href="/" className={`${styles.brand} font-serif`}>
          <span className={styles.brandMark} aria-hidden="true">
            J
          </span>
          <span>
            <small>REPOSITÓRIO</small>
            <strong>jiddu · system atlas</strong>
          </span>
        </Link>

        <dl className={styles.stats} aria-label="Snapshot do codebase">
          {CODEBASE_STATS.map((stat) => (
            <div key={stat.label} className={styles.stat}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>

        <div className={styles.topActions}>
          <button type="button" onClick={toggleTrace}>
            {isPlaying ? (
              <Pause aria-hidden="true" />
            ) : (
              <Play aria-hidden="true" />
            )}
            {isPlaying ? "Pausar fluxo" : "Percorrer fluxo"}
          </button>
          <button type="button" onClick={traceOneStep}>
            <StepForward aria-hidden="true" />
            Um passo
          </button>
          <button type="button" onClick={reset}>
            <RotateCcw aria-hidden="true" />
            Resetar
          </button>
        </div>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.indexPanel} aria-label="Índice do sistema">
          <div className={styles.panelHeading}>
            <span>O SISTEMA</span>
            <strong>Mapa do codebase</strong>
          </div>

          <label className={styles.searchBox}>
            <span className={styles.srOnly}>Buscar módulo ou arquivo</span>
            <Search aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar módulo ou arquivo"
            />
          </label>

          <button
            type="button"
            className={`${styles.systemButton} ${
              activeDomain === null && selectedNodeId === null
                ? styles.indexActive
                : ""
            }`}
            aria-pressed={activeDomain === null && selectedNodeId === null}
            onClick={() => selectDomain(null)}
          >
            <span>00</span>
            <strong>Sistema inteiro</strong>
            <small>{ARCHITECTURE_NODES.length}</small>
          </button>

          <nav className={styles.domainList} aria-label="Camadas do codebase">
            {DOMAINS.map((domain) => {
              const domainItems = ARCHITECTURE_NODES.filter(
                (item) =>
                  item.domain === domain.id && matchedIds.has(item.id),
              );
              if (normalizedQuery && domainItems.length === 0) return null;

              return (
                <section key={domain.id} className={styles.domainSection}>
                  <button
                    type="button"
                    className={`${styles.domainButton} ${
                      activeDomain === domain.id ? styles.indexActive : ""
                    }`}
                    aria-pressed={activeDomain === domain.id}
                    onClick={() => selectDomain(domain.id)}
                  >
                    <span>{domain.code}</span>
                    <strong>{domain.label}</strong>
                    <small>
                      {
                        ARCHITECTURE_NODES.filter(
                          (item) => item.domain === domain.id,
                        ).length
                      }
                    </small>
                  </button>
                  <div className={styles.nodeIndex}>
                    {domainItems.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className={
                          selectedNodeId === item.id ? styles.nodeIndexActive : ""
                        }
                        aria-pressed={selectedNodeId === item.id}
                        onClick={() => selectNode(item.id)}
                      >
                        <span>{item.code}</span>
                        {item.title}
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </nav>

          {normalizedQuery && matchedIds.size === 0 ? (
            <p className={styles.emptySearch}>Nenhum módulo encontrado.</p>
          ) : null}
        </aside>

        <section className={styles.mapPanel} aria-label="Diagrama do Jiddu">
          <ReactFlow
            className={styles.flow}
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={(_event, node) => selectNode(node.id)}
            onPaneClick={() => {
              setSelectedNodeId(null);
              setIsPlaying(false);
            }}
            fitView
            fitViewOptions={{ padding: 0.12, maxZoom: 0.74 }}
            minZoom={0.28}
            maxZoom={1.55}
            panOnScroll
            zoomOnDoubleClick={false}
            nodesDraggable={false}
            deleteKeyCode={null}
            colorMode="light"
            proOptions={{ hideAttribution: false }}
          >
            <Controls
              position="top-right"
              showInteractive={false}
              fitViewOptions={{ padding: 0.12, maxZoom: 0.74 }}
            />
            <Panel position="top-left" className={styles.mapLabel}>
              <span>ARQUITETURA</span>
              <strong>arraste para mover · scroll para zoom</strong>
            </Panel>
            <Panel position="bottom-left" className={styles.legend}>
              <span>
                <i className={styles.legendSolid} /> fluxo principal
              </span>
              <span>
                <i className={styles.legendDashed} /> serviço compartilhado
              </span>
              <span>
                <i className={styles.legendActive} /> seleção / percurso
              </span>
            </Panel>
          </ReactFlow>
        </section>

        <aside className={styles.detailPanel} aria-live="polite">
          <div className={styles.detailTabs} role="tablist" aria-label="Detalhes">
            <button
              type="button"
              role="tab"
              aria-selected={detailTab === "what"}
              onClick={() => setDetailTab("what")}
            >
              O que faz
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={detailTab === "how"}
              onClick={() => setDetailTab("how")}
            >
              Como é feito
            </button>
          </div>

          <div className={styles.detailBody}>
            <p className={styles.detailEyebrow}>{detailEyebrow}</p>
            <h1>{detailTitle}</h1>

            <section className={styles.detailSection}>
              <h2>{detailTab === "what" ? "Papel no sistema" : "Construção"}</h2>
              <p>
                {detailTab === "what" ? detailSummary : detailImplementation}
              </p>
            </section>

            {detailTab === "how" && selectedNode ? (
              <section className={styles.detailSection}>
                <h2>Arquivos-chave</h2>
                <ul className={styles.fileList}>
                  {selectedNode.files.map((file) => (
                    <li key={file}>
                      <code>{file}</code>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {detailTab === "what" && selectedNode && connectedNodes.length ? (
              <section className={styles.detailSection}>
                <h2>Conexões diretas</h2>
                <div className={styles.connectionList}>
                  {connectedNodes.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => selectNode(item.id)}
                    >
                      <span>{item.code}</span>
                      {item.title}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {!selectedNode && !selectedDomain ? (
              <section className={styles.detailSection}>
                <h2>Como ler</h2>
                <p>
                  Selecione um bloco para ver seus arquivos e vizinhos. Use o
                  percurso para acompanhar uma análise de falácias da entrada ao
                  leitor final.
                </p>
              </section>
            ) : null}
          </div>

          <div className={styles.detailFooter}>
            <span>snapshot · 18 ago 2026</span>
            <span>Next.js · React · Prisma</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
