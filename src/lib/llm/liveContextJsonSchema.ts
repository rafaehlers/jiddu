import {
  LIVE_CONTEXT_ENTITY_KINDS,
  LIVE_CONTEXT_TERM_KINDS,
} from "../live-context-schema";

const sentenceIds = {
  type: "array",
  items: { type: "string" },
} as const;

// OpenAI strict-mode compatible: every property is required and nested
// objects reject unknown keys.
export const LIVE_CONTEXT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "language",
    "tags",
    "topics",
    "terms",
    "entities",
    "relations",
    "segment",
    "summary",
  ],
  properties: {
    language: { type: ["string", "null"] },
    tags: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "sentenceIds", "confidence"],
        properties: {
          label: { type: "string" },
          sentenceIds,
          confidence: { type: "number" },
        },
      },
    },
    topics: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "sentenceIds", "confidence"],
        properties: {
          label: { type: "string" },
          sentenceIds,
          confidence: { type: "number" },
        },
      },
    },
    terms: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "term",
          "kind",
          "explanation",
          "sentenceIds",
          "confidence",
        ],
        properties: {
          term: { type: "string" },
          kind: { type: "string", enum: LIVE_CONTEXT_TERM_KINDS },
          explanation: { type: "string" },
          sentenceIds,
          confidence: { type: "number" },
        },
      },
    },
    entities: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "name",
          "kind",
          "description",
          "aliases",
          "sentenceIds",
          "confidence",
          "importance",
        ],
        properties: {
          name: { type: "string" },
          kind: { type: "string", enum: LIVE_CONTEXT_ENTITY_KINDS },
          description: { type: "string" },
          aliases: { type: "array", items: { type: "string" } },
          sentenceIds,
          confidence: { type: "number" },
          importance: { type: "number" },
        },
      },
    },
    relations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "sourceName",
          "targetName",
          "label",
          "description",
          "sentenceIds",
          "confidence",
          "importance",
        ],
        properties: {
          sourceName: { type: "string" },
          targetName: { type: "string" },
          label: { type: "string" },
          description: { type: "string" },
          sentenceIds,
          confidence: { type: "number" },
          importance: { type: "number" },
        },
      },
    },
    segment: {
      type: "object",
      additionalProperties: false,
      required: ["title", "summary", "sentenceIds"],
      properties: {
        title: { type: "string" },
        summary: { type: "string" },
        sentenceIds,
      },
    },
    summary: { type: "string" },
  },
} as const;
