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

export const PAPER_EVIDENCE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "methodSummary",
    "resultSummary",
    "independentInterpretation",
    "uncertainties",
    "visualAudit",
  ],
  properties: {
    methodSummary: NULLABLE_STATEMENT_SCHEMA,
    resultSummary: NULLABLE_STATEMENT_SCHEMA,
    independentInterpretation: NULLABLE_STATEMENT_SCHEMA,
    uncertainties: {
      type: "array",
      items: STATEMENT_SCHEMA,
    },
    visualAudit: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["pageNumber", "label", "assessment", "concern"],
        properties: {
          pageNumber: { type: "integer", minimum: 1 },
          label: { type: "string" },
          assessment: { type: "string" },
          concern: {
            anyOf: [{ type: "string" }, { type: "null" }],
          },
        },
      },
    },
  },
} as const;
