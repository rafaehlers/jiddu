const STATEMENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["text", "blockIds"],
  properties: {
    text: { type: "string" },
    blockIds: {
      type: "array",
      items: { type: "string" },
    },
  },
} as const;

const NULLABLE_STATEMENT_SCHEMA = {
  anyOf: [STATEMENT_SCHEMA, { type: "null" }],
} as const;

// OpenAI strict-mode rules: every property is required and nested objects
// reject additional keys. Nullable statements let the model say that a
// paper/excerpt never supplies the requested information.
export const PAPER_SYNTHESIS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["overview", "paperMap"],
  properties: {
    overview: { type: "string" },
    paperMap: {
      type: "object",
      additionalProperties: false,
      required: [
        "paperTypes",
        "contributionTypes",
        "researchQuestion",
        "contribution",
        "approach",
        "mainAnswer",
        "evidence",
        "statedLimitation",
      ],
      properties: {
        paperTypes: {
          type: "array",
          items: { type: "string" },
        },
        contributionTypes: {
          type: "array",
          items: { type: "string" },
        },
        researchQuestion: NULLABLE_STATEMENT_SCHEMA,
        contribution: NULLABLE_STATEMENT_SCHEMA,
        approach: NULLABLE_STATEMENT_SCHEMA,
        mainAnswer: NULLABLE_STATEMENT_SCHEMA,
        evidence: NULLABLE_STATEMENT_SCHEMA,
        statedLimitation: NULLABLE_STATEMENT_SCHEMA,
      },
    },
  },
} as const;
