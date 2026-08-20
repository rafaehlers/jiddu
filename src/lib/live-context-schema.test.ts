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
  entities: [],
  relations: [],
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

test("repairs clear geographic type contradictions in entity descriptions", () => {
  const sanitized = sanitizeLiveContextWindow(
    {
      ...firstWindow,
      entities: [
        {
          name: "Fortaleza",
          kind: "event",
          description: "Cidade mencionada como destino da água.",
          aliases: [],
          sentenceIds: ["s1"],
          confidence: 0.99,
          importance: 0.8,
        },
        {
          name: "Rio de Janeiro",
          kind: "country",
          description: "Localização regional associada ao instituto.",
          aliases: [],
          sentenceIds: ["s1"],
          confidence: 0.95,
          importance: 0.7,
        },
      ],
    },
    new Set(["s1"]),
  );

  assert.ok(sanitized);
  assert.deepEqual(
    sanitized.entities.map((entity) => [entity.name, entity.kind]),
    [
      ["Fortaleza", "city"],
      ["Rio de Janeiro", "region"],
    ],
  );
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

test("deduplicates entity aliases and preserves stable relation endpoints", () => {
  const first = mergeLiveContext(EMPTY_LIVE_CONTEXT, {
    ...firstWindow,
    entities: [
      {
        name: "Luiz Inácio Lula da Silva",
        kind: "person",
        description: "Presidente citado na conversa.",
        aliases: ["Lula"],
        sentenceIds: ["s1"],
        confidence: 0.96,
        importance: 0.91,
      },
      {
        name: "Petrobras",
        kind: "organization",
        description: "Empresa mencionada.",
        aliases: [],
        sentenceIds: ["s1"],
        confidence: 0.95,
        importance: 0.88,
      },
    ],
  });
  const second = mergeLiveContext(first, {
    ...firstWindow,
    entities: [
      {
        name: "Lula",
        kind: "person",
        description: "O interlocutor volta a mencionar Lula.",
        aliases: ["Luiz Inácio Lula da Silva"],
        sentenceIds: ["s2"],
        confidence: 0.98,
        importance: 0.94,
      },
      {
        name: "Petrobras",
        kind: "organization",
        description: "Empresa mencionada novamente.",
        aliases: [],
        sentenceIds: ["s2"],
        confidence: 0.97,
        importance: 0.9,
      },
    ],
    relations: [
      {
        sourceName: "Lula",
        targetName: "Petrobras",
        label: "comentou sobre",
        description: "A conversa associa Lula a um comentário sobre a empresa.",
        sentenceIds: ["s2"],
        confidence: 0.9,
        importance: 0.86,
      },
    ],
    segment: { ...firstWindow.segment, sentenceIds: ["s2"] },
  });

  assert.equal(second.entities.length, 2);
  assert.equal(second.entities[0].id, "entity1");
  assert.deepEqual(second.entities[0].sentenceIds, ["s1", "s2"]);
  assert.equal(second.relations.length, 1);
  assert.equal(second.relations[0].sourceEntityId, "entity1");
  assert.equal(second.relations[0].targetEntityId, "entity2");

  const third = mergeLiveContext(second, {
    ...firstWindow,
    entities: [
      {
        name: "Lula",
        kind: "person",
        description: "Pessoa já resolvida.",
        aliases: ["Luiz Inácio Lula da Silva"],
        sentenceIds: ["s3"],
        confidence: 0.96,
        importance: 0.9,
      },
      {
        name: "Petrobras",
        kind: "organization",
        description: "Empresa já resolvida.",
        aliases: [],
        sentenceIds: ["s3"],
        confidence: 0.96,
        importance: 0.9,
      },
    ],
    relations: [
      {
        sourceName: "Lula",
        targetName: "Petrobras",
        label: "comentou sobre",
        description: "A relação volta a ser mencionada.",
        sentenceIds: ["s3"],
        confidence: 0.95,
        importance: 0.9,
      },
    ],
    segment: { ...firstWindow.segment, sentenceIds: ["s3"] },
  });
  assert.equal(third.relations.length, 1);
  assert.deepEqual(third.relations[0].sentenceIds, ["s2", "s3"]);
});

test("drops entity relations that are weak, unanchored or missing endpoints", () => {
  const sanitized = sanitizeLiveContextWindow(
    {
      ...firstWindow,
      entities: [
        {
          name: "Organização A",
          kind: "organization",
          description: "Entidade válida.",
          aliases: [],
          sentenceIds: ["s1"],
          confidence: 0.9,
          importance: 0.8,
        },
        {
          name: "Pessoa B",
          kind: "person",
          description: "Pessoa válida.",
          aliases: [],
          sentenceIds: ["s1"],
          confidence: 0.91,
          importance: 0.8,
        },
      ],
      relations: [
        {
          sourceName: "Organização A",
          targetName: "Pessoa B",
          label: "contratou",
          description: "Relação ancorada.",
          sentenceIds: ["s1"],
          confidence: 0.9,
          importance: 0.8,
        },
        {
          sourceName: "Organização A",
          targetName: "Pessoa B",
          label: "talvez conheça",
          description: "Relação fraca.",
          sentenceIds: ["s1"],
          confidence: 0.4,
          importance: 0.3,
        },
        {
          sourceName: "Organização A",
          targetName: "Pessoa inexistente",
          label: "citou",
          description: "Endpoint ausente.",
          sentenceIds: ["s1"],
          confidence: 0.99,
          importance: 0.9,
        },
      ],
    },
    new Set(["s1"]),
  );

  assert.ok(sanitized);
  assert.deepEqual(sanitized.relations.map((relation) => relation.label), [
    "contratou",
  ]);
});

test("keeps a listener-corrected entity name across later analysis windows", () => {
  const corrected = mergeLiveContext(EMPTY_LIVE_CONTEXT, {
    ...firstWindow,
    entities: [
      {
        name: "Emily Chow",
        kind: "person",
        description: "Pessoa apresentada na conversa.",
        aliases: [],
        sentenceIds: ["s1"],
        confidence: 0.9,
        importance: 0.9,
      },
    ],
  });
  corrected.entities[0] = {
    ...corrected.entities[0],
    name: "Emily Zhao",
    aliases: ["Emily Chow"],
    userCorrectedName: true,
  };

  const next = mergeLiveContext(corrected, {
    ...firstWindow,
    entities: [
      {
        name: "Emily Chow",
        kind: "person",
        description: "A pessoa volta a ser citada.",
        aliases: [],
        sentenceIds: ["s2"],
        confidence: 0.99,
        importance: 0.95,
      },
    ],
    segment: { ...firstWindow.segment, sentenceIds: ["s2"] },
  });

  assert.equal(next.entities.length, 1);
  assert.equal(next.entities[0].name, "Emily Zhao");
  assert.equal(next.entities[0].userCorrectedName, true);
  assert.deepEqual(next.entities[0].sentenceIds, ["s1", "s2"]);
});

test("keeps a listener-corrected entity type across later analysis windows", () => {
  const corrected = mergeLiveContext(EMPTY_LIVE_CONTEXT, {
    ...firstWindow,
    entities: [
      {
        name: "Fortaleza",
        kind: "city",
        description: "Cidade mencionada na conversa.",
        aliases: [],
        sentenceIds: ["s1"],
        confidence: 0.9,
        importance: 0.8,
      },
    ],
  });
  corrected.entities[0] = {
    ...corrected.entities[0],
    userCorrectedKind: true,
  };

  const next = mergeLiveContext(corrected, {
    ...firstWindow,
    entities: [
      {
        name: "Fortaleza",
        kind: "event",
        description: "Entidade classificada incorretamente novamente.",
        aliases: [],
        sentenceIds: ["s2"],
        confidence: 0.99,
        importance: 0.9,
      },
    ],
    segment: { ...firstWindow.segment, sentenceIds: ["s2"] },
  });

  assert.equal(next.entities.length, 1);
  assert.equal(next.entities[0].kind, "city");
  assert.deepEqual(next.entities[0].sentenceIds, ["s1", "s2"]);
});
