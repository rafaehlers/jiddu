import { CLAIM_TYPES } from "../claims-schema";

// Same constraints as ANALYSIS_JSON_SCHEMA: every property in required,
// no additionalProperties, no min/max/pattern/format keywords. Anthropic
// is lenient; OpenAI strict-mode requires this shape.
export const CLAIMS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["language", "claims"],
  properties: {
    language: { type: ["string", "null"] },
    claims: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["sentenceIds", "statement", "type", "rationale"],
        properties: {
          sentenceIds: {
            type: "array",
            items: { type: "string" },
          },
          statement: { type: "string" },
          type: { type: "string", enum: CLAIM_TYPES },
          rationale: { type: "string" },
        },
      },
    },
  },
} as const;
