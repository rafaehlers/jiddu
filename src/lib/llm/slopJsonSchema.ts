import { SLOP_IDS } from "../slop";

// Same OpenAI strict-mode rules as ANALYSIS_JSON_SCHEMA (see jsonSchema.ts):
// every property required, additionalProperties: false, no bounds keywords.
export const SLOP_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["language", "score", "summary", "findings"],
  properties: {
    language: { type: ["string", "null"] },
    score: { type: "integer" },
    summary: { type: "string" },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["sentenceIds", "pattern", "severity", "quote", "explanation"],
        properties: {
          sentenceIds: {
            type: "array",
            items: { type: "string" },
          },
          pattern: { type: "string", enum: SLOP_IDS },
          severity: { type: "string", enum: ["low", "high"] },
          quote: { type: "string" },
          explanation: { type: "string" },
        },
      },
    },
  },
} as const;
