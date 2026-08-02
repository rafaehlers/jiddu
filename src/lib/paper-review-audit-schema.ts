import { z } from "zod";
import { ReviewSeveritySchema } from "./paper-review-schema";

export const REVIEW_DEPTHS = ["standard", "deep"] as const;
export const ReviewDepthSchema = z.enum(REVIEW_DEPTHS);
export type ReviewDepth = z.infer<typeof ReviewDepthSchema>;

export const SPECS_CRITERIA = [
  "story",
  "presentation",
  "evaluations",
  "correctness",
  "significance",
] as const;
export const SpecsCriterionSchema = z.enum(SPECS_CRITERIA);
export type SpecsCriterion = z.infer<typeof SpecsCriterionSchema>;

export const COMPUTATION_OPERATIONS = [
  "sum",
  "difference",
  "product",
  "quotient",
  "mean",
  "weighted_mean",
  "percentage",
  "percentage_change",
  "precision",
  "recall",
  "f1",
] as const;

export const ComputationProposalSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  location: z.string().min(1),
  operation: z.enum(COMPUTATION_OPERATIONS),
  values: z.array(z.number().finite()).min(1).max(100),
  weights: z.array(z.number().finite()).max(100).default([]),
  reportedValue: z.number().finite(),
  tolerance: z.number().finite().nonnegative().default(0.001),
  unit: z.string().nullable().default(null),
});
export type ComputationProposal = z.infer<typeof ComputationProposalSchema>;

export const SpecsFindingSchema = z.object({
  id: z.string().regex(/^[SPECG]\d+$/),
  criterion: SpecsCriterionSchema,
  title: z.string().min(1),
  body: z.string().min(1),
  locations: z.array(z.string().min(1)).min(1),
  severity: ReviewSeveritySchema,
  confidence: z.number().min(0).max(1),
  retainInFinal: z.boolean(),
  claimIds: z.array(z.string().min(1)).default([]),
});
export type SpecsFinding = z.infer<typeof SpecsFindingSchema>;

export const SpecsStageResultSchema = z.object({
  criterion: SpecsCriterionSchema,
  summary: z.string().min(1),
  findings: z.array(SpecsFindingSchema),
  computationChecks: z.array(ComputationProposalSchema).default([]),
});
export type SpecsStageResult = z.infer<typeof SpecsStageResultSchema>;

export const ComputationAuditItemSchema = ComputationProposalSchema.extend({
  status: z.enum(["passed", "failed", "invalid"]),
  computedValue: z.number().finite().nullable(),
  absoluteError: z.number().finite().nonnegative().nullable(),
  note: z.string().min(1),
});
export type ComputationAuditItem = z.infer<typeof ComputationAuditItemSchema>;

// MiniMax occasionally wraps prose fields in a small object even though the
// tool schema asks for a string (for example, { issue, evidence }). Preserve
// those useful string fragments while still rejecting arrays, nested objects,
// numbers and other arbitrary shapes.
const ModelGeneratedTextSchema = z.preprocess((value) => {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return value;
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (
    entries.length === 0 ||
    entries.length > 8 ||
    entries.some(([, text]) => typeof text !== "string" || !text.trim())
  ) {
    return value;
  }

  if (entries.length === 1) return (entries[0][1] as string).trim();
  return entries
    .map(([key, text]) => `${humanizeTextKey(key)}: ${(text as string).trim()}`)
    .join(" ");
}, z.string().trim().min(1));

function humanizeTextKey(value: string): string {
  const text = value.replaceAll(/[_-]+/g, " ").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "Detail";
}

export const QualityAuditFlagSchema = z.object({
  category: z.enum([
    "unsupported_claim",
    "structural",
    "severity",
    "recommendation",
    "citation",
    "bias",
    "anonymity",
    "editorial",
  ]),
  severity: z.enum(["warning", "blocking"]),
  description: ModelGeneratedTextSchema,
  relatedFindingIds: z.array(z.string().min(1)).default([]),
});

export const QualityAuditSchema = z.object({
  summary: ModelGeneratedTextSchema,
  flags: z.array(QualityAuditFlagSchema),
  findingDecisions: z.array(
    z.object({
      findingId: z.string().min(1),
      decision: z.enum(["retain", "dismiss"]),
      reason: ModelGeneratedTextSchema,
    }),
  ),
});
export type QualityAudit = z.infer<typeof QualityAuditSchema>;

export const RetentionAuditSchema = z.object({
  requiredFindingIds: z.array(z.string()),
  retainedFindingIds: z.array(z.string()),
  dismissedFindingIds: z.array(z.string()),
  missingFindingIds: z.array(z.string()),
});
export type RetentionAudit = z.infer<typeof RetentionAuditSchema>;

export type PaperReviewAuditBundle = {
  depth: ReviewDepth;
  specs: SpecsStageResult[];
  computations: ComputationAuditItem[];
  quality: QualityAudit;
  retention: RetentionAudit;
  stageModels: Record<string, string>;
};
