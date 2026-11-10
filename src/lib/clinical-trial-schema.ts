import { z } from "zod";

export const CLINICAL_TRIAL_CHECKS = [
  "abstract_results",
  "text_tables",
  "comparison_direction",
  "participant_flow",
  "intention_to_treat",
  "randomization_blinding",
  "outcomes_analysis",
  "uncertainty_harms",
  "supported_conclusions",
] as const;

export const CLINICAL_TRIAL_STATUSES = [
  "demonstrable_error",
  "missing_information",
  "possible_limitation",
  "no_issue_found",
  "not_assessable",
  "not_applicable",
] as const;

export function isClinicalTrialConcern(status: ClinicalTrialStatus): boolean {
  return status === "demonstrable_error" ||
    status === "missing_information" || status === "possible_limitation";
}

export const ClinicalTrialItemSchema = z.object({
  key: z.enum(CLINICAL_TRIAL_CHECKS),
  status: z.enum(CLINICAL_TRIAL_STATUSES),
  details: z.string().trim().min(1),
  locations: z.array(z.string().trim().min(1)).min(1),
  findingIds: z.array(z.string().regex(/^E\d+$/)),
}).superRefine((item, ctx) => {
  if (isClinicalTrialConcern(item.status) !== (item.findingIds.length > 0)) {
    ctx.addIssue({
      code: "custom",
      path: ["findingIds"],
      message: "Concerns require supporting evaluation findings; other statuses must not cite findings.",
    });
  }
});

export const ClinicalTrialCheckSchema = z.object({
  studyDesign: z.enum(["randomized", "nonrandomized"]),
  rationale: z.string().trim().min(1),
  locations: z.array(z.string().trim().min(1)).min(1),
  checks: z.array(ClinicalTrialItemSchema).length(CLINICAL_TRIAL_CHECKS.length),
}).superRefine((check, ctx) => {
  if (new Set(check.checks.map((item) => item.key)).size !== CLINICAL_TRIAL_CHECKS.length) {
    ctx.addIssue({ code: "custom", path: ["checks"], message: "Include each clinical trial check exactly once." });
  }
});

// The language is supplied by the job, never inferred from model-generated prose.
export const ClinicalTrialReportSchema = z.object({
  language: z.enum(["en", "pt", "es"]),
  assessment: ClinicalTrialCheckSchema,
});

export type ClinicalTrialStatus = typeof CLINICAL_TRIAL_STATUSES[number];
export type ClinicalTrialCheck = z.infer<typeof ClinicalTrialCheckSchema>;
export type ClinicalTrialReport = z.infer<typeof ClinicalTrialReportSchema>;

// Models fill a fixed set of named slots. Stored/public reports keep the
// existing array contract; never truncate extra items or silently drop keys.
export function normalizeClinicalTrialResponse(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const stage = value as Record<string, unknown>;
  const assessment = stage.clinicalTrialCheck;
  if (!assessment || typeof assessment !== "object" || Array.isArray(assessment)) return value;
  const fields = assessment as Record<string, unknown>;
  const checks = fields.checks;
  if (!checks || typeof checks !== "object" || Array.isArray(checks)) return value;
  const slots = checks as Record<string, unknown>;
  const keys = Object.keys(slots);
  if (keys.length !== CLINICAL_TRIAL_CHECKS.length ||
      !CLINICAL_TRIAL_CHECKS.every((key) => Object.hasOwn(slots, key))) return value;
  const items = CLINICAL_TRIAL_CHECKS.map((key) => {
    const item = slots[key];
    if (!item || typeof item !== "object" || Array.isArray(item)) return item;
    // A conflicting model-generated key is invalid rather than overwritten.
    if ("key" in item && item.key !== key) return item;
    return { ...item, key };
  });
  return { ...stage, clinicalTrialCheck: { ...fields, checks: items } };
}

const clinicalTrialSlot = {
  type: "object",
  additionalProperties: false,
  required: ["status", "details", "locations", "findingIds"],
  properties: {
    status: { type: "string", enum: CLINICAL_TRIAL_STATUSES },
    details: { type: "string", minLength: 1 },
    locations: { type: "array", minItems: 1, items: { type: "string", minLength: 1 } },
    findingIds: { type: "array", items: { type: "string", pattern: "^E[0-9]+$" } },
  },
} as const;

export const CLINICAL_TRIAL_CHECK_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["studyDesign", "rationale", "locations", "checks"],
  properties: {
    studyDesign: { type: "string", enum: ["randomized", "nonrandomized"] },
    rationale: { type: "string", minLength: 1 },
    locations: { type: "array", minItems: 1, items: { type: "string", minLength: 1 } },
    checks: {
      type: "object",
      additionalProperties: false,
      required: CLINICAL_TRIAL_CHECKS,
      properties: Object.fromEntries(CLINICAL_TRIAL_CHECKS.map((key) => [key, clinicalTrialSlot])),
    },
  },
} as const;
