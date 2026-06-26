import { SECTION_ROLES } from "../explain-schema";

// OpenAI strict-mode rules mirrored from ANALYSIS_JSON_SCHEMA: every key in
// `properties` appears in `required`, additionalProperties false, no
// min/max/pattern keywords.
export const EXPLAIN_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["language", "overview", "findings"],
  properties: {
    language: { type: ["string", "null"] },
    overview: { type: "string" },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["blockIds", "role", "explanation"],
        properties: {
          blockIds: {
            type: "array",
            items: { type: "string" },
          },
          role: { type: "string", enum: SECTION_ROLES },
          explanation: { type: "string" },
        },
      },
    },
  },
} as const;
