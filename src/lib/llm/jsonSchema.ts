import { FALLACY_IDS } from "../fallacies";

// OpenAI strict-mode rules:
//  • Every key in `properties` must appear in `required`
//  • `additionalProperties: false` on every object
//  • Forbidden keywords: minimum/maximum, minItems/maxItems, minLength/maxLength,
//    pattern, format, etc.
// Anthropic tool_use is more lenient but accepts the same schema fine.
export const ANALYSIS_JSON_SCHEMA = {
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
        required: ["sentenceIds", "fallacy", "severity", "quote", "explanation"],
        properties: {
          sentenceIds: {
            type: "array",
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
