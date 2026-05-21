import {
  NEUTRALITY_ISSUES,
  NEUTRALITY_VERDICTS,
  TEXT_TYPES,
} from "../neutrality-schema";

// OpenAI strict-mode rules mirrored from ANALYSIS_JSON_SCHEMA: every key
// in `required`, additionalProperties false, no min/max/pattern.
export const NEUTRALITY_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["language", "textType", "verdict", "confidence", "rationale", "findings"],
  properties: {
    language: { type: ["string", "null"] },
    textType: { type: "string", enum: TEXT_TYPES },
    verdict: { type: "string", enum: NEUTRALITY_VERDICTS },
    confidence: { type: "number" },
    rationale: { type: "string" },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["sentenceIds", "issue", "severity", "quote", "explanation"],
        properties: {
          sentenceIds: {
            type: "array",
            items: { type: "string" },
          },
          issue: { type: "string", enum: NEUTRALITY_ISSUES },
          severity: { type: "string", enum: ["low", "high"] },
          quote: { type: "string" },
          explanation: { type: "string" },
        },
      },
    },
  },
} as const;
