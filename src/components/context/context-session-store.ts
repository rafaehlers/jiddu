import { createStore } from "zustand/vanilla";
import type {
  KnowledgeEntityDTO,
  KnowledgeRelationDTO,
} from "@/lib/context-knowledge-schema";
import type { ContextReplayEventKind } from "@/lib/context-replay-schema";
import {
  mergeContextEntities,
  removeContextEntity,
  renameContextEntity,
  replaceEntityNamesInClaims,
} from "@/lib/context-session-mutations";
import {
  EMPTY_LIVE_CONTEXT,
  type LiveContext,
} from "@/lib/live-context-schema";
import type {
  LiveClaim,
  LiveNeutralityVerdict,
} from "@/lib/live/use-live-analysis";
import type {
  LiveSessionError,
  LiveSessionState,
  LiveSource,
} from "@/lib/live/use-live-session";
import type { NeutralityFinding } from "@/lib/neutrality-schema";
import type { Finding } from "@/lib/schema";
import type { Verdict } from "@/lib/verdict-schema";
import type { ContextEntityMutation } from "./context-entity-mutations";

export type ContextPipelineAgentKind =
  | "capture"
  | "analysis"
  | "profiles"
  | "news"
  | "verification";

export type ContextPipelineAgent = {
  id: ContextPipelineAgentKind;
  processes: number;
  requests: number;
  model: string | null;
  provider: string | null;
  startedAt: number;
  durationMs: number;
};

export type ContextSessionEvent = {
  id: string;
  kind: ContextReplayEventKind;
  elapsedMs: number;
  sentenceIds: string[];
  payload: unknown;
  createdAt: string;
  syncStatus: "local" | "pending" | "syncing" | "synced";
};

export type ContextCaptureState = {
  state: LiveSessionState;
  source: LiveSource;
  transcript: string;
  error: LiveSessionError | null;
  billingReservationId: string | null;
  localAudioUrl: string | null;
  elapsedMs: number;
};

export type ContextAnalysisState = {
  findings: Finding[];
  claims: LiveClaim[];
  neutralityFindings: NeutralityFinding[];
  neutralityVerdict: LiveNeutralityVerdict | null;
  context: LiveContext;
  score: number | null;
  sessionId: string | null;
  model: string | null;
  provider: string | null;
  isAnalyzing: boolean;
  error: string | null;
};

export type ContextVerificationState = {
  verdicts: ReadonlyMap<string, Verdict>;
  verifyingClaimIds: ReadonlySet<string>;
  claimErrors: ReadonlyMap<string, string>;
  isVerifying: boolean;
};

export type ContextEnrichmentState = {
  entities: ReadonlyMap<string, KnowledgeEntityDTO>;
  relations: ReadonlyMap<string, KnowledgeRelationDTO>;
  errors: ReadonlyMap<string, string>;
  profileRequests: number;
  newsRequests: number;
};

export type ContextSessionStore = {
  capture: ContextCaptureState;
  analysis: ContextAnalysisState;
  verification: ContextVerificationState;
  enrichment: ContextEnrichmentState;
  agents: ReadonlyMap<ContextPipelineAgentKind, ContextPipelineAgent>;
  events: ContextSessionEvent[];
  eventRevision: number;
  pendingMutations: ReadonlyMap<string, ContextEntityMutation>;
  committedMutations: ReadonlyMap<string, ContextEntityMutation>;
  canonicalContext: LiveContext;
  canonicalClaims: LiveClaim[];
  resetSession: (source: LiveSource) => void;
  syncCapture: (capture: ContextCaptureState) => void;
  syncAnalysis: (analysis: ContextAnalysisState) => void;
  syncVerification: (verification: ContextVerificationState) => void;
  syncEnrichment: (enrichment: ContextEnrichmentState) => void;
  syncAgents: (agents: ContextPipelineAgent[]) => void;
  beginEntityMutation: (
    operationId: string,
    mutation: ContextEntityMutation,
  ) => void;
  commitEntityMutation: (
    operationId: string,
    context: LiveContext,
    claims: LiveClaim[],
  ) => void;
  rollbackEntityMutation: (operationId: string) => void;
  markEvents: (
    ids: string[],
    status: ContextSessionEvent["syncStatus"],
  ) => void;
};

export type ContextSessionStoreApi = ReturnType<typeof createContextSessionStore>;

const EMPTY_CAPTURE: ContextCaptureState = {
  state: "idle",
  source: "mic",
  transcript: "",
  error: null,
  billingReservationId: null,
  localAudioUrl: null,
  elapsedMs: 0,
};

const EMPTY_ANALYSIS: ContextAnalysisState = {
  findings: [],
  claims: [],
  neutralityFindings: [],
  neutralityVerdict: null,
  context: EMPTY_LIVE_CONTEXT,
  score: null,
  sessionId: null,
  model: null,
  provider: null,
  isAnalyzing: false,
  error: null,
};

const EMPTY_VERIFICATION: ContextVerificationState = {
  verdicts: new Map(),
  verifyingClaimIds: new Set(),
  claimErrors: new Map(),
  isVerifying: false,
};

const EMPTY_ENRICHMENT: ContextEnrichmentState = {
  entities: new Map(),
  relations: new Map(),
  errors: new Map(),
  profileRequests: 0,
  newsRequests: 0,
};

export function createContextSessionStore() {
  return createStore<ContextSessionStore>()((set) => ({
    capture: { ...EMPTY_CAPTURE },
    analysis: { ...EMPTY_ANALYSIS },
    verification: { ...EMPTY_VERIFICATION },
    enrichment: { ...EMPTY_ENRICHMENT },
    agents: new Map(),
    events: [],
    eventRevision: 0,
    pendingMutations: new Map(),
    committedMutations: new Map(),
    canonicalContext: EMPTY_LIVE_CONTEXT,
    canonicalClaims: [],
    resetSession: (source) =>
      set({
        capture: { ...EMPTY_CAPTURE, source },
        analysis: { ...EMPTY_ANALYSIS },
        verification: { ...EMPTY_VERIFICATION },
        enrichment: { ...EMPTY_ENRICHMENT },
        agents: new Map(),
        events: [],
        eventRevision: 0,
        pendingMutations: new Map(),
        committedMutations: new Map(),
        canonicalContext: EMPTY_LIVE_CONTEXT,
        canonicalClaims: [],
      }),
    syncCapture: (capture) =>
      set((state) => {
        const events = [...state.events];
        if (capture.state !== state.capture.state) {
          appendEvent(events, {
            kind: "capture_state_changed",
            elapsedMs: capture.elapsedMs,
            payload: { state: capture.state, source: capture.source },
            persist: capture.state !== "idle",
          });
        }
        if (capture.transcript !== state.capture.transcript) {
          const delta = transcriptDelta(
            state.capture.transcript,
            capture.transcript,
          );
          if (delta) {
            appendTranscriptDelta(events, delta, capture.elapsedMs);
          }
        }
        return {
          capture,
          events,
          eventRevision:
            events === state.events || events.length === state.events.length
              ? state.eventRevision
              : state.eventRevision + 1,
        };
      }),
    syncAnalysis: (analysis) =>
      set((state) => {
        const events = [...state.events];
        appendNewAnalysisEvents(events, state.analysis, analysis, captureTime(state));
        const derived = applyMutationLayers(
          analysis.context,
          analysis.claims,
          state.committedMutations,
          state.pendingMutations,
        );
        return {
          canonicalContext: analysis.context,
          canonicalClaims: analysis.claims,
          analysis: {
            ...analysis,
            context: derived.context,
            claims: derived.claims,
          },
          events,
          eventRevision:
            events.length === state.events.length
              ? state.eventRevision
              : state.eventRevision + 1,
        };
      }),
    syncVerification: (verification) =>
      set((state) => {
        const events = [...state.events];
        for (const [claimId, verdict] of verification.verdicts) {
          if (!state.verification.verdicts.has(claimId)) {
            appendEvent(events, {
              kind: "claim_verified",
              elapsedMs: captureTime(state),
              sentenceIds:
                state.analysis.claims.find((claim) => claim.id === claimId)
                  ?.sentenceIds ?? [],
              payload: verdict,
            });
          }
        }
        return {
          verification,
          events,
          eventRevision:
            events.length === state.events.length
              ? state.eventRevision
              : state.eventRevision + 1,
        };
      }),
    syncEnrichment: (enrichment) => set({ enrichment }),
    syncAgents: (agents) =>
      set((state) => {
        const next = new Map(agents.map((agent) => [agent.id, agent]));
        const events = [...state.events];
        for (const agent of agents) {
          if (!state.agents.has(agent.id)) {
            appendEvent(events, {
              kind: "operation_started",
              elapsedMs: captureTime(state),
              payload: agent,
            });
          }
        }
        for (const previous of state.agents.values()) {
          if (!next.has(previous.id)) {
            appendEvent(events, {
              kind: "operation_completed",
              elapsedMs: captureTime(state),
              payload: {
                ...previous,
                durationMs: previous.durationMs,
              },
            });
          }
        }
        return {
          agents: next,
          events,
          eventRevision:
            events.length === state.events.length
              ? state.eventRevision
              : state.eventRevision + 1,
        };
      }),
    beginEntityMutation: (operationId, mutation) =>
      set((state) => {
        const pendingMutations = new Map(state.pendingMutations);
        pendingMutations.set(operationId, mutation);
        const derived = applyMutationLayers(
          state.canonicalContext,
          state.canonicalClaims,
          state.committedMutations,
          pendingMutations,
        );
        return {
          pendingMutations,
          analysis: {
            ...state.analysis,
            context: derived.context,
            claims: derived.claims,
          },
        };
      }),
    commitEntityMutation: (operationId, context, claims) =>
      set((state) => {
        const pendingMutations = new Map(state.pendingMutations);
        const mutation = pendingMutations.get(operationId);
        pendingMutations.delete(operationId);
        const committedMutations = new Map(state.committedMutations);
        if (mutation) committedMutations.set(operationId, mutation);
        const derived = applyMutationLayers(
          context,
          claims,
          committedMutations,
          pendingMutations,
        );
        const events = [...state.events];
        if (mutation) {
          appendEvent(events, mutationEvent(mutation, captureTime(state)));
        }
        return {
          pendingMutations,
          committedMutations,
          canonicalContext: context,
          canonicalClaims: claims,
          analysis: {
            ...state.analysis,
            context: derived.context,
            claims: derived.claims,
          },
          events,
          eventRevision: state.eventRevision + (mutation ? 1 : 0),
        };
      }),
    rollbackEntityMutation: (operationId) =>
      set((state) => {
        const pendingMutations = new Map(state.pendingMutations);
        pendingMutations.delete(operationId);
        const derived = applyMutationLayers(
          state.canonicalContext,
          state.canonicalClaims,
          state.committedMutations,
          pendingMutations,
        );
        return {
          pendingMutations,
          analysis: {
            ...state.analysis,
            context: derived.context,
            claims: derived.claims,
          },
        };
      }),
    markEvents: (ids, syncStatus) =>
      set((state) => {
        const selected = new Set(ids);
        return {
          events: state.events.map((event) =>
            selected.has(event.id) ? { ...event, syncStatus } : event,
          ),
          eventRevision: state.eventRevision + 1,
        };
      }),
  }));
}

function appendNewAnalysisEvents(
  events: ContextSessionEvent[],
  previous: ContextAnalysisState,
  next: ContextAnalysisState,
  elapsedMs: number,
) {
  appendNewItems(events, previous.findings, next.findings, findingKey, (item) => ({
    kind: "finding_detected",
    sentenceIds: item.sentenceIds,
    payload: item,
  }), elapsedMs);
  appendNewItems(events, previous.claims, next.claims, (item) => item.id, (item) => ({
    kind: "claim_detected",
    sentenceIds: item.sentenceIds,
    payload: item,
  }), elapsedMs);
  appendNewItems(
    events,
    previous.neutralityFindings,
    next.neutralityFindings,
    neutralityFindingKey,
    (item) => ({
      kind: "neutrality_finding_detected",
      sentenceIds: item.sentenceIds,
      payload: item,
    }),
    elapsedMs,
  );
  if (
    next.neutralityVerdict &&
    next.neutralityVerdict !== previous.neutralityVerdict
  ) {
    appendEvent(events, {
      kind: "neutrality_assessed",
      elapsedMs,
      payload: next.neutralityVerdict,
    });
  }
  if (next.context !== previous.context) {
    appendEvent(events, {
      kind: "context_snapshot",
      elapsedMs,
      sentenceIds: [
        ...next.context.entities.flatMap((entity) => entity.sentenceIds),
        ...next.context.relations.flatMap((relation) => relation.sentenceIds),
      ],
      payload: next.context,
    });
  }
}

function appendNewItems<T>(
  events: ContextSessionEvent[],
  previous: T[],
  next: T[],
  key: (item: T) => string,
  event: (item: T) => Pick<ContextSessionEvent, "kind" | "sentenceIds" | "payload">,
  elapsedMs: number,
) {
  const existing = new Set(previous.map(key));
  for (const item of next) {
    if (existing.has(key(item))) continue;
    appendEvent(events, { ...event(item), elapsedMs });
  }
}

function appendTranscriptDelta(
  events: ContextSessionEvent[],
  delta: string,
  elapsedMs: number,
) {
  const last = events.at(-1);
  if (
    last?.kind === "transcript_delta" &&
    last.syncStatus === "pending" &&
    elapsedMs - last.elapsedMs <= 1_500 &&
    typeof (last.payload as { delta?: unknown })?.delta === "string"
  ) {
    last.payload = {
      delta: `${(last.payload as { delta: string }).delta}${delta}`,
    };
    last.elapsedMs = elapsedMs;
    return;
  }
  appendEvent(events, {
    kind: "transcript_delta",
    elapsedMs,
    payload: { delta },
    persist: true,
  });
}

function appendEvent(
  events: ContextSessionEvent[],
  input: {
    kind: ContextReplayEventKind;
    elapsedMs: number;
    sentenceIds?: string[];
    payload: unknown;
    persist?: boolean;
  },
) {
  events.push({
    id: createEventId(),
    kind: input.kind,
    elapsedMs: Math.max(0, Math.floor(input.elapsedMs)),
    sentenceIds: [...new Set(input.sentenceIds ?? [])],
    payload: input.payload,
    createdAt: new Date().toISOString(),
    syncStatus: input.persist ? "pending" : "local",
  });
}

function mutationEvent(
  mutation: ContextEntityMutation,
  elapsedMs: number,
): Parameters<typeof appendEvent>[1] {
  if (mutation.action === "rename") {
    return { kind: "entity_renamed", elapsedMs, payload: mutation };
  }
  if (mutation.action === "merge") {
    return { kind: "entities_merged", elapsedMs, payload: mutation };
  }
  return { kind: "entity_removed", elapsedMs, payload: mutation };
}

function applyPendingMutations(
  canonicalContext: LiveContext,
  canonicalClaims: LiveClaim[],
  pending: ReadonlyMap<string, ContextEntityMutation>,
): { context: LiveContext; claims: LiveClaim[] } {
  let context = canonicalContext;
  let claims = canonicalClaims;
  for (const mutation of pending.values()) {
    try {
      if (mutation.action === "rename") {
        const result = renameContextEntity(
          context,
          mutation.localEntityId,
          mutation.name,
        );
        context = result.context;
        claims = replaceEntityNamesInClaims(claims, [
          { from: result.previousName, to: result.currentName },
        ]);
      } else if (mutation.action === "merge") {
        const result = mergeContextEntities(
          context,
          mutation.sourceLocalEntityId,
          mutation.targetLocalEntityId,
        );
        context = result.context;
        claims = replaceEntityNamesInClaims(claims, [
          { from: result.sourceName, to: result.mergedName },
          { from: result.previousTargetName, to: result.mergedName },
        ]);
      } else {
        context = removeContextEntity(context, mutation.localEntityId).context;
      }
    } catch {
      // A later canonical snapshot may already include this mutation.
    }
  }
  return { context, claims };
}

function applyMutationLayers(
  canonicalContext: LiveContext,
  canonicalClaims: LiveClaim[],
  committed: ReadonlyMap<string, ContextEntityMutation>,
  pending: ReadonlyMap<string, ContextEntityMutation>,
) {
  const committedResult = applyPendingMutations(
    canonicalContext,
    canonicalClaims,
    committed,
  );
  return applyPendingMutations(
    committedResult.context,
    committedResult.claims,
    pending,
  );
}

function transcriptDelta(previous: string, next: string): string {
  if (next.startsWith(previous)) return next.slice(previous.length);
  return next ? `\n${next}` : "";
}

function captureTime(state: Pick<ContextSessionStore, "capture">) {
  return state.capture.elapsedMs;
}

function findingKey(finding: Finding) {
  return `${[...finding.sentenceIds].sort().join(",")}::${finding.fallacy}`;
}

function neutralityFindingKey(finding: NeutralityFinding) {
  return `${[...finding.sentenceIds].sort().join(",")}::${finding.issue}`;
}

function createEventId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `ctx_${crypto.randomUUID()}`
    : `ctx_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
