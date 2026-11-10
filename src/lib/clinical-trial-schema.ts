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

export const CLINICAL_TRIAL_CHECK_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["studyDesign", "rationale", "locations", "checks"],
  properties: {
    studyDesign: { type: "string", enum: ["randomized", "nonrandomized"] },
    rationale: { type: "string" },
    locations: { type: "array", minItems: 1, items: { type: "string" } },
    checks: {
      type: "array",
      minItems: CLINICAL_TRIAL_CHECKS.length,
      maxItems: CLINICAL_TRIAL_CHECKS.length,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "status", "details", "locations", "findingIds"],
        properties: {
          key: { type: "string", enum: CLINICAL_TRIAL_CHECKS },
          status: { type: "string", enum: CLINICAL_TRIAL_STATUSES },
          details: { type: "string" },
          locations: { type: "array", minItems: 1, items: { type: "string" } },
          findingIds: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;
