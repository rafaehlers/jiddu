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

const VISUAL_AUDIT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["pageNumber", "label", "assessment", "concern"],
  properties: {
    pageNumber: { type: "integer", minimum: 1 },
    label: { type: "string" },
    assessment: { type: "string" },
    concern: { anyOf: [{ type: "string" }, { type: "null" }] },
  },
} as const;

const CHALLENGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "independentInterpretation",
    "authorsInterpretation",
    "comparison",
    "alignment",
    "abstractFidelity",
    "visualAudit",
    "uncertainties",
  ],
  properties: {
    independentInterpretation: NULLABLE_STATEMENT_SCHEMA,
    authorsInterpretation: NULLABLE_STATEMENT_SCHEMA,
    comparison: NULLABLE_STATEMENT_SCHEMA,
    alignment: {
      type: "string",
      enum: ["aligned", "partially_aligned", "divergent", "unclear"],
    },
    abstractFidelity: {
      anyOf: [
        {
          type: "object",
          additionalProperties: false,
          required: ["verdict", "explanation", "blockIds"],
          properties: {
            verdict: {
              type: "string",
              enum: [
                "faithful",
                "partially_faithful",
                "misleading",
                "not_assessable",
              ],
            },
            explanation: { type: "string" },
            blockIds: { type: "array", items: { type: "string" } },
          },
        },
        { type: "null" },
      ],
    },
    visualAudit: { type: "array", items: VISUAL_AUDIT_SCHEMA },
    uncertainties: { type: "array", items: STATEMENT_SCHEMA },
  },
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
        "quickScan",
        "evidenceChain",
        "notebook",
        "challenge",
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
        quickScan: {
          type: "object",
          additionalProperties: false,
          required: [
            "category",
            "context",
            "apparentCorrectness",
            "contributions",
            "clarity",
          ],
          properties: {
            category: NULLABLE_STATEMENT_SCHEMA,
            context: NULLABLE_STATEMENT_SCHEMA,
            apparentCorrectness: NULLABLE_STATEMENT_SCHEMA,
            contributions: NULLABLE_STATEMENT_SCHEMA,
            clarity: NULLABLE_STATEMENT_SCHEMA,
          },
        },
        evidenceChain: {
          type: "object",
          additionalProperties: false,
          required: [
            "bigQuestion",
            "specificQuestion",
            "method",
            "result",
            "interpretation",
            "conclusion",
          ],
          properties: {
            bigQuestion: NULLABLE_STATEMENT_SCHEMA,
            specificQuestion: NULLABLE_STATEMENT_SCHEMA,
            method: NULLABLE_STATEMENT_SCHEMA,
            result: NULLABLE_STATEMENT_SCHEMA,
            interpretation: NULLABLE_STATEMENT_SCHEMA,
            conclusion: NULLABLE_STATEMENT_SCHEMA,
          },
        },
        notebook: {
          type: "object",
          additionalProperties: false,
          required: [
            "keyTerms",
            "questionsForAuthors",
            "confusingPassages",
            "implicitAssumptions",
            "furtherReading",
          ],
          properties: {
            keyTerms: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["term", "meaning", "blockIds"],
                properties: {
                  term: { type: "string" },
                  meaning: { type: "string" },
                  blockIds: { type: "array", items: { type: "string" } },
                },
              },
            },
            questionsForAuthors: { type: "array", items: STATEMENT_SCHEMA },
            confusingPassages: { type: "array", items: STATEMENT_SCHEMA },
            implicitAssumptions: { type: "array", items: STATEMENT_SCHEMA },
            furtherReading: { type: "array", items: STATEMENT_SCHEMA },
          },
        },
        challenge: {
          anyOf: [CHALLENGE_SCHEMA, { type: "null" }],
        },
      },
    },
  },
} as const;
