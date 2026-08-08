import assert from "node:assert/strict";
import test from "node:test";
import { EMPTY_LIVE_CONTEXT, type LiveContext } from "@/lib/live-context-schema";
import {
  createContextSessionStore,
  type ContextAnalysisState,
  type ContextCaptureState,
} from "./context-session-store";

test("captures transcript progress as compact private replay deltas", () => {
  const store = createContextSessionStore();
  store.getState().syncCapture(capture({ state: "live", transcript: "Olá" }));
  store
    .getState()
    .syncCapture(capture({ state: "live", transcript: "Olá mundo", elapsedMs: 900 }));

  const transcriptEvents = store
    .getState()
    .events.filter((event) => event.kind === "transcript_delta");
  assert.equal(transcriptEvents.length, 1);
  assert.deepEqual(transcriptEvents[0].payload, { delta: "Olá mundo" });
  assert.equal(transcriptEvents[0].syncStatus, "pending");
});

test("keeps an optimistic correction over a stale analysis response", () => {
  const store = createContextSessionStore();
  const original = contextWithEntity("Emily Chow");
  store.getState().syncAnalysis(analysis(original));
  store.getState().beginEntityMutation("rename-1", {
    action: "rename",
    localEntityId: "person-1",
    name: "Emily Zhao",
  });

  store.getState().syncAnalysis(
    analysis({ ...original, summary: "A newer but stale model response" }),
  );

  assert.equal(store.getState().analysis.context.entities[0].name, "Emily Zhao");
  assert.equal(store.getState().canonicalContext.entities[0].name, "Emily Chow");
});

test("rolls an optimistic correction back without losing the canonical graph", () => {
  const store = createContextSessionStore();
  store.getState().syncAnalysis(analysis(contextWithEntity("Emily Chow")));
  store.getState().beginEntityMutation("rename-1", {
    action: "rename",
    localEntityId: "person-1",
    name: "Emily Zhao",
  });
  store.getState().rollbackEntityMutation("rename-1");

  assert.equal(store.getState().analysis.context.entities[0].name, "Emily Chow");
  assert.equal(store.getState().pendingMutations.size, 0);
});

test("keeps a committed correction authoritative over a delayed model event", () => {
  const store = createContextSessionStore();
  const original = contextWithEntity("Emily Chow");
  const corrected = contextWithEntity("Emily Zhao");
  store.getState().syncAnalysis(analysis(original));
  store.getState().beginEntityMutation("rename-1", {
    action: "rename",
    localEntityId: "person-1",
    name: "Emily Zhao",
  });
  store.getState().commitEntityMutation("rename-1", corrected, []);

  store.getState().syncAnalysis(
    analysis({ ...original, summary: "Delayed model response" }),
  );

  assert.equal(store.getState().analysis.context.entities[0].name, "Emily Zhao");
  assert.equal(store.getState().committedMutations.size, 1);
});

test("tracks real pipeline operations and their lifecycle", () => {
  const store = createContextSessionStore();
  store.getState().syncAgents([
    {
      id: "analysis",
      processes: 5,
      requests: 1,
      model: "openai/gpt",
      provider: "OpenRouter",
      startedAt: 100,
      durationMs: 250,
    },
  ]);
  store.getState().syncAgents([]);

  assert.deepEqual(
    store
      .getState()
      .events.filter((event) => event.kind.startsWith("operation_"))
      .map((event) => event.kind),
    ["operation_started", "operation_completed"],
  );
  assert.equal(store.getState().agents.size, 0);
});

function capture(
  overrides: Partial<ContextCaptureState> = {},
): ContextCaptureState {
  return {
    state: "idle",
    source: "mic",
    transcript: "",
    error: null,
    billingReservationId: null,
    localAudioUrl: null,
    elapsedMs: 0,
    ...overrides,
  };
}

function analysis(context: LiveContext): ContextAnalysisState {
  return {
    findings: [],
    claims: [],
    neutralityFindings: [],
    neutralityVerdict: null,
    context,
    score: null,
    sessionId: "session-1",
    model: null,
    provider: null,
    isAnalyzing: false,
    error: null,
  };
}

function contextWithEntity(name: string): LiveContext {
  return {
    ...EMPTY_LIVE_CONTEXT,
    entities: [
      {
        id: "person-1",
        name,
        kind: "person",
        description: `${name} foi mencionada`,
        aliases: [],
        sentenceIds: ["s1"],
        confidence: 0.94,
        importance: 0.9,
      },
    ],
  };
}
