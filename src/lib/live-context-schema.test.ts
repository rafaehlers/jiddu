import assert from "node:assert/strict";
import test from "node:test";
import {
  EMPTY_LIVE_CONTEXT,
  mergeLiveContext,
  readLiveContext,
  sanitizeLiveContextWindow,
  type LiveContextWindow,
} from "./live-context-schema";

const firstWindow: LiveContextWindow = {
  language: "pt",
  tags: [
    { label: "Marketing", sentenceIds: ["s1"], confidence: 0.9 },
    { label: "Mídia", sentenceIds: ["s1"], confidence: 0.88 },
  ],
  topics: [{ label: "Mídia paga", sentenceIds: ["s1"], confidence: 0.91 }],
  terms: [
    {
      term: "paid",
      kind: "jargon",
      explanation: "Canais de mídia paga.",
      sentenceIds: ["s1"],
      confidence: 0.94,
    },
  ],
  segment: {
    title: "Aquisição de clientes",
    summary: "A conversa trata do custo de aquisição.",
    sentenceIds: ["s1"],
  },
  summary: "A conversa aborda aquisição e mídia paga.",
};

test("merges repeated context without duplicating topics, terms or segments", () => {
  const first = mergeLiveContext(EMPTY_LIVE_CONTEXT, firstWindow);
  const second = mergeLiveContext(first, {
    ...firstWindow,
    tags: [
      { label: "marketing", sentenceIds: ["s2"], confidence: 0.94 },
    ],
    topics: [
      { label: "Midia paga", sentenceIds: ["s2"], confidence: 0.95 },
    ],
    terms: [
      {
        ...firstWindow.terms[0],
        sentenceIds: ["s2"],
        explanation: "Canais nos quais a empresa paga para anunciar.",
        confidence: 0.97,
      },
    ],
    segment: {
      ...firstWindow.segment,
      sentenceIds: ["s2"],
      summary: "O foco passa a ser a escala dos anúncios.",
    },
  });

  assert.equal(second.tags.length, 2);
  assert.deepEqual(second.tags[0].sentenceIds, ["s1", "s2"]);
  assert.equal(second.topics.length, 1);
  assert.deepEqual(second.topics[0].sentenceIds, ["s1", "s2"]);
  assert.equal(second.terms.length, 1);
  assert.equal(
    second.terms[0].explanation,
    "Canais nos quais a empresa paga para anunciar.",
  );
  assert.equal(second.segments.length, 1);
  assert.deepEqual(second.segments[0].sentenceIds, ["s1", "s2"]);
});

test("filters low-confidence and unanchored context", () => {
  const sanitized = sanitizeLiveContextWindow(
    {
      ...firstWindow,
      tags: [
        ...firstWindow.tags,
        { label: "Incerta", sentenceIds: ["s1"], confidence: 0.4 },
        { label: "Fora", sentenceIds: ["s9"], confidence: 0.99 },
      ],
      topics: [
        ...firstWindow.topics,
        { label: "Fora", sentenceIds: ["s9"], confidence: 0.99 },
      ],
      terms: [
        ...firstWindow.terms,
        {
          term: "óbvio",
          kind: "slang",
          explanation: "Não deve aparecer.",
          sentenceIds: ["s1"],
          confidence: 0.4,
        },
      ],
    },
    new Set(["s1"]),
  );

  assert.ok(sanitized);
  assert.deepEqual(sanitized.tags.map((tag) => tag.label), [
    "Marketing",
    "Mídia",
  ]);
  assert.deepEqual(sanitized.topics.map((topic) => topic.label), ["Mídia paga"]);
  assert.deepEqual(sanitized.terms.map((term) => term.term), ["paid"]);
});

test("reads context created before broad tags existed", () => {
  const legacy = readLiveContext(
    JSON.stringify({
      topics: [],
      terms: [],
      segments: [],
      summary: "Sessão antiga.",
    }),
  );

  assert.deepEqual(legacy.tags, []);
  assert.deepEqual(legacy.relatedLinks, []);
  assert.equal(legacy.summary, "Sessão antiga.");
});

test("rejects a context window whose segment is not anchored", () => {
  assert.equal(
    sanitizeLiveContextWindow(
      {
        ...firstWindow,
        segment: { ...firstWindow.segment, sentenceIds: ["s99"] },
      },
      new Set(["s1"]),
    ),
    null,
  );
});
