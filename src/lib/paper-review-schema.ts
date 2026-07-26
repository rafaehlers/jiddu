import { z } from "zod";

export const REVIEW_SEVERITIES = ["MAJOR", "MODERATE", "MINOR"] as const;
export const ReviewSeveritySchema = z.enum(REVIEW_SEVERITIES);
export type ReviewSeverity = z.infer<typeof ReviewSeveritySchema>;

export const REVIEW_RECOMMENDATIONS = [
  "Accept",
  "Minor revision",
  "Major revision required before reconsideration",
  "Reject",
] as const;
export const ReviewRecommendationSchema = z.enum(REVIEW_RECOMMENDATIONS);
export type ReviewRecommendation = z.infer<typeof ReviewRecommendationSchema>;

export const LocatedItemSchema = z.object({
  text: z.string().min(1),
  locations: z.array(z.string().min(1)).min(1),
});
export type LocatedItem = z.infer<typeof LocatedItemSchema>;

export const ReviewWeaknessSchema = z.object({
  id: z.string().regex(/^W\d+$/),
  severity: ReviewSeveritySchema,
  title: z.string().min(1),
  body: z.string().min(1),
  locations: z.array(z.string().min(1)).min(1),
});
export type ReviewWeakness = z.infer<typeof ReviewWeaknessSchema>;

export const ReviewSourceSchema = z.object({
  url: z.string().url(),
  title: z.string().nullable(),
});
export type ReviewSource = z.infer<typeof ReviewSourceSchema>;

export const PaperReviewResultSchema = z.object({
  paper: z.string().min(1),
  author: z.string().min(1),
  venueTarget: z.string().min(1),
  reviewDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  stageFindings: z.object({
    story: z.string().min(1),
    presentation: z.string().min(1),
    evaluations: z.string().min(1),
    correctness: z.string().min(1),
    significance: z.string().min(1),
  }),
  summary: z.string().min(1),
  strengths: z.array(LocatedItemSchema),
  weaknesses: z.array(ReviewWeaknessSchema),
  questions: z.array(z.string().min(1)),
  overallAssessment: z.string().min(1),
  publicationPath: z.array(z.string().min(1)).min(1),
  recommendation: ReviewRecommendationSchema,
  sources: z.array(ReviewSourceSchema),
});
export type PaperReviewResult = z.infer<typeof PaperReviewResultSchema>;

export const LedgerClaimSchema = z.object({
  id: z.string().min(1),
  statement: z.string().min(1),
  kind: z.enum([
    "necessary",
    "sufficient",
    "causal",
    "empirical",
    "quantitative",
    "novelty",
    "significance",
    "other",
  ]),
  locations: z.array(z.string().min(1)).min(1),
  evidenceInPaper: z.string().min(1),
  structural: z.boolean(),
});

export const PaperLedgerSchema = z.object({
  paperTitle: z.string().min(1),
  author: z.string().min(1),
  centralContribution: z.string().min(1),
  constructDefinitions: z.array(LocatedItemSchema),
  claims: z.array(LedgerClaimSchema),
  unitOfAnalysis: z.string().min(1),
  systemBoundary: z.string().min(1),
  hypotheses: z.array(LocatedItemSchema),
  evaluationDesign: z.array(LocatedItemSchema),
  metricsAndOutcomes: z.array(LocatedItemSchema),
  falsificationConditions: z.array(LocatedItemSchema),
  limitationsAndExclusions: z.array(LocatedItemSchema),
  candidateInternalProblems: z.array(
    z.object({
      classification: z.enum([
        "OUTRIGHT CONTRADICTION",
        "SCOPE AMBIGUITY",
        "CONSTRUCT COLLISION",
        "EVIDENCE GAP",
        "EXPERIMENTAL GAP",
      ]),
      description: z.string().min(1),
      locations: z.array(z.string().min(1)).min(1),
      reconciliationAttempt: z.string().min(1),
    }),
  ),
});
export type PaperLedger = z.infer<typeof PaperLedgerSchema>;

export type PaperResearch = {
  synthesis: string;
  sources: ReviewSource[];
};
