import { FALLACY_IDS } from "../fallacies";

export const ANALYSIS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["score", "summary", "findings"],
  properties: {
    language: { type: ["string", "null"] },
    score: { type: "integer", minimum: 0, maximum: 100 },
    summary: { type: "string" },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["sentenceIds", "fallacy", "severity", "quote", "explanation"],
        properties: {
          sentenceIds: {
            type: "array",
            minItems: 1,
            items: { type: "string" },
          },
          fallacy: { type: "string", enum: FALLACY_IDS },
          severity: { type: "string", enum: ["low", "high"] },
          quote: { type: "string" },
          explanation: { type: "string" },
        },
      },
    },
  },
} as const;
