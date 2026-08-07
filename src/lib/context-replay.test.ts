import assert from "node:assert/strict";
import test from "node:test";
import type { ContextReplayEvent } from "./context-replay-schema";
import {
  buildContextReplayFrame,
  type ContextReplaySource,
} from "./context-replay";
import { EMPTY_LIVE_CONTEXT } from "./live-context-schema";

const sentences = [
  { id: "s1", start: 0, end: 9, text: "Primeira." },
  { id: "s2", start: 10, end: 18, text: "Segunda." },
];

function source(
  overrides: Partial<ContextReplaySource> = {},
): ContextReplaySource {
  return {
    transcript: "Primeira. Segunda.",
    sentences,
    audioDurationMs: 20_000,
    context: EMPTY_LIVE_CONTEXT,
    findings: [],
    claims: [],
    verdicts: [],
    neutralityFindings: [],
    neutralityVerdict: null,
    events: [],
    ...overrides,
  };
}

function event(
  value: Partial<ContextReplayEvent> & Pick<ContextReplayEvent, "kind">,
): ContextReplayEvent {
  return {
    id: value.id ?? crypto.randomUUID(),
    kind: value.kind,
    elapsedMs: value.elapsedMs ?? 10_000,
    sentenceIds: value.sentenceIds ?? ["s1"],
    payload: value.payload ?? {},
    createdAt: value.createdAt ?? new Date().toISOString(),
  };
}

test("approximates old sessions from sentence position", () => {
  const context = {
    ...EMPTY_LIVE_CONTEXT,
    entities: [
      {
        id: "e1",
        name: "Ana",
        kind: "person" as const,
        description: "Pessoa mencionada",
        aliases: [],
        sentenceIds: ["s1"],
        confidence: 0.9,
        importance: 0.8,
      },
      {
        id: "e2",
        name: "Banco",
        kind: "institution" as const,
        description: "Instituição mencionada",
        aliases: [],
        sentenceIds: ["s2"],
        confidence: 0.9,
        importance: 0.8,
      },
    ],
  };
  const frame = buildContextReplayFrame(source({ context }), 11_000);
  assert.equal(frame.exact, false);
  assert.deepEqual(
    frame.context.entities.map((entity) => entity.id),
    ["e1"],
  );
});

test("uses the latest exact context snapshot and preserves later corrections", () => {
  const first = {
    ...EMPTY_LIVE_CONTEXT,
    entities: [
      {
        id: "e1",
        name: "Emily Chow",
        kind: "person" as const,
        description: "Pessoa",
        aliases: [],
        sentenceIds: ["s1"],
        confidence: 0.9,
        importance: 0.9,
      },
    ],
  };
  const corrected = {
    ...first,
    entities: [{ ...first.entities[0], name: "Emily Zhao" }],
  };
  const events = [
    event({
      kind: "context_snapshot",
      elapsedMs: 0,
      sentenceIds: [],
      payload: EMPTY_LIVE_CONTEXT,
    }),
    event({ kind: "context_snapshot", elapsedMs: 5_000, payload: first }),
    event({
      kind: "context_snapshot",
      elapsedMs: 12_000,
      payload: corrected,
    }),
  ];
  assert.equal(
    buildContextReplayFrame(source({ context: corrected, events }), 8_000)
      .context.entities[0].name,
    "Emily Chow",
  );
  assert.equal(
    buildContextReplayFrame(source({ context: corrected, events }), 13_000)
      .context.entities[0].name,
    "Emily Zhao",
  );
});

test("always returns the authoritative saved state at the end", () => {
  const finalContext = { ...EMPTY_LIVE_CONTEXT, dismissedEntityNames: ["X"] };
  const frame = buildContextReplayFrame(
    source({ context: finalContext, events: [] }),
    20_000,
  );
  assert.equal(frame.atEnd, true);
  assert.equal(frame.context, finalContext);
  assert.equal(frame.transcript, "Primeira. Segunda.");
});
