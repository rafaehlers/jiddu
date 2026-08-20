import assert from "node:assert/strict";
import test from "node:test";
import {
  EMPTY_LIVE_CONTEXT,
  mergeLiveContext,
  type LiveContext,
} from "./live-context-schema";
import type { LiveClaim } from "./live/use-live-analysis";
import { applyLiveAnalysisConfig } from "./live-analysis-context";
import {
  mergeContextEntities,
  removeContextEntity,
  renameContextEntity,
  retypeContextEntity,
  replaceEntityNamesInClaims,
} from "./context-session-mutations";

const context: LiveContext = {
  ...EMPTY_LIVE_CONTEXT,
  tags: [],
  relatedLinks: [],
  dismissedEntityNames: [],
  topics: [],
  terms: [],
  segments: [],
  summary: "",
  entities: [
    {
      id: "emily",
      name: "Emily Chow",
      kind: "person",
      description: "Emily Chow foi mencionada como investidora.",
      aliases: [],
      sentenceIds: ["s1"],
      confidence: 0.94,
      importance: 0.9,
    },
    {
      id: "daniel",
      name: "Daniel",
      kind: "person",
      description: "Daniel participou da conversa.",
      aliases: [],
      sentenceIds: ["s2"],
      confidence: 0.99,
      importance: 0.7,
    },
    {
      id: "danielle",
      name: "Danielle Dr.",
      kind: "person",
      description: "Danielle Dr. foi citada.",
      aliases: [],
      sentenceIds: ["s3"],
      confidence: 0.82,
      importance: 0.75,
      userCorrectedName: true,
    },
    {
      id: "company",
      name: "Acme",
      kind: "organization",
      description: "Empresa citada.",
      aliases: [],
      sentenceIds: ["s1"],
      confidence: 0.98,
      importance: 0.8,
    },
  ],
  relations: [
    {
      id: "r1",
      sourceEntityId: "daniel",
      targetEntityId: "company",
      label: "trabalha para",
      description: "Daniel trabalha para Acme.",
      sentenceIds: ["s2"],
      confidence: 0.8,
      importance: 0.7,
    },
    {
      id: "r2",
      sourceEntityId: "danielle",
      targetEntityId: "company",
      label: "trabalha para",
      description: "Danielle Dr. trabalha para Acme.",
      sentenceIds: ["s3"],
      confidence: 0.9,
      importance: 0.8,
    },
  ],
};

test("marks a corrected name as authoritative and preserves the old transcription as an alias", () => {
  const correctedAt = new Date("2026-08-07T12:00:00.000Z");
  const result = renameContextEntity(
    context,
    "emily",
    "Emily Zhao",
    correctedAt,
  );
  const entity = result.context.entities[0];

  assert.equal(entity.name, "Emily Zhao");
  assert.equal(entity.userCorrectedName, true);
  assert.equal(entity.userCorrectedAt, correctedAt.toISOString());
  assert.deepEqual(entity.aliases, ["Emily Chow"]);
  assert.equal(
    entity.description,
    "Emily Zhao foi mencionada como investidora.",
  );
});

test("marks a corrected entity type as authoritative", () => {
  const correctedAt = new Date("2026-08-20T12:00:00.000Z");
  const result = retypeContextEntity(
    {
      ...context,
      entities: [
        {
          ...context.entities[3],
          id: "fortaleza",
          name: "Fortaleza",
          kind: "event",
        },
      ],
    },
    "fortaleza",
    "city",
    correctedAt,
  );
  const entity = result.context.entities[0];

  assert.equal(result.previousKind, "event");
  assert.equal(entity.kind, "city");
  assert.equal(entity.userCorrectedKind, true);
  assert.equal(entity.userCorrectedKindAt, correctedAt.toISOString());
});

test("merges duplicate entities, redirects and deduplicates their relations", () => {
  const result = mergeContextEntities(context, "daniel", "danielle");
  const entity = result.context.entities.find((item) => item.id === "danielle");

  assert.equal(result.context.entities.length, 3);
  assert.equal(entity?.name, "Danielle Dr.");
  assert.deepEqual(entity?.sentenceIds, ["s3", "s2"]);
  assert.ok(entity?.aliases.includes("Daniel"));
  assert.equal(result.context.relations.length, 1);
  assert.equal(result.context.relations[0].sourceEntityId, "danielle");
  assert.deepEqual(result.context.relations[0].sentenceIds, ["s2", "s3"]);
  assert.equal(result.context.relations[0].confidence, 0.9);
});

test("keeps a configured speaker authoritative when its graph card is merged", () => {
  const configured: LiveContext = {
    ...context,
    analysisConfig: {
      mode: "speech",
      participants: [
        {
          entityId: "speaker",
          name: "Candidato Silva",
          role: "primary_speaker",
          placeholder: false,
        },
      ],
    },
    entities: [
      {
        id: "speaker",
        name: "Candidato Silva",
        kind: "person",
        description: "Discursante configurado.",
        aliases: [],
        sentenceIds: [],
        confidence: 1,
        importance: 1,
        participantRole: "primary_speaker",
        userSupplied: true,
        placeholder: false,
      },
      context.entities[0],
    ],
    relations: [],
  };

  const merged = mergeContextEntities(configured, "speaker", "emily");
  const speaker = merged.context.entities.find((entity) => entity.id === "emily");
  const participant = merged.context.analysisConfig.participants[0];

  assert.equal(speaker?.userSupplied, true);
  assert.equal(speaker?.participantRole, "primary_speaker");
  assert.equal(speaker?.placeholder, false);
  assert.equal(participant.entityId, "emily");
  assert.equal(participant.name, "Emily Chow");

  const reapplied = applyLiveAnalysisConfig(
    merged.context,
    merged.context.analysisConfig,
    "pt",
  );
  assert.equal(
    reapplied.entities.filter((entity) => entity.id === "emily").length,
    1,
  );
});

test("removes an incorrect entity, its relations and remembers the dismissal", () => {
  const result = removeContextEntity(context, "daniel");

  assert.equal(result.removedName, "Daniel");
  assert.equal(
    result.context.entities.some((entity) => entity.id === "daniel"),
    false,
  );
  assert.equal(
    result.context.relations.some(
      (relation) =>
        relation.sourceEntityId === "daniel" ||
        relation.targetEntityId === "daniel",
    ),
    false,
  );
  assert.deepEqual(result.context.dismissedEntityNames, ["Daniel"]);

  const next = mergeLiveContext(result.context, {
    language: "pt",
    tags: [],
    topics: [],
    terms: [],
    entities: [
      {
        name: "Daniel",
        kind: "person",
        description: "Daniel voltou a ser extraído por engano.",
        aliases: [],
        sentenceIds: ["s4"],
        confidence: 0.99,
        importance: 0.9,
      },
    ],
    relations: [],
    segment: {
      title: "Continuação",
      summary: "A conversa continuou.",
      sentenceIds: ["s4"],
    },
    summary: "A conversa continuou.",
  });
  assert.equal(
    next.entities.some((entity) => entity.name === "Daniel"),
    false,
  );
});

test("updates extracted claims without duplicating a corrected full name", () => {
  const claims: LiveClaim[] = [
    {
      id: "c1",
      sentenceIds: ["s2"],
      statement: "Daniel trabalha na Acme e Daniel Docter lidera a área.",
      type: "categorical",
      rationale: "A função de Daniel deve ser verificada.",
    },
  ];
  const updated = replaceEntityNamesInClaims(claims, [
    { from: "Daniel", to: "Daniel Docter" },
  ]);

  assert.equal(
    updated[0].statement,
    "Daniel Docter trabalha na Acme e Daniel Docter lidera a área.",
  );
  assert.equal(
    updated[0].rationale,
    "A função de Daniel Docter deve ser verificada.",
  );
});
