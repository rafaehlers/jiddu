import { z } from "zod";
import { LiveParticipantRoleSchema } from "./live-analysis-config";

export const CLAIM_TYPES = [
  "numeric",
  "date",
  "quote",
  "causal",
  "categorical",
] as const;

export type ClaimType = (typeof CLAIM_TYPES)[number];

// Coerce out-of-spec type strings into one of the canonical types so a
// model that emits "statistic" or "quotation" doesn't crash the whole run.
const ClaimTypeSchema = z.preprocess((v) => {
  if (typeof v !== "string") return "categorical";
  const s = v.toLowerCase().trim();
  if (CLAIM_TYPES.includes(s as ClaimType)) return s;
  if (["number", "numerical", "statistic", "stat", "percent", "percentage"].includes(s)) return "numeric";
  if (["time", "year", "period", "datetime"].includes(s)) return "date";
  if (["quotation", "attribution", "said", "statement_attribution"].includes(s)) return "quote";
  if (["causation", "cause", "effect", "cause_effect"].includes(s)) return "causal";
  if (["category", "definition", "factual", "identity", "membership"].includes(s)) return "categorical";
  return "categorical";
}, z.enum(CLAIM_TYPES));

export const ClaimSchema = z.object({
  sentenceIds: z.array(z.string()).min(1),
  statement: z.string().min(1),
  type: ClaimTypeSchema,
  rationale: z.string().min(1),
  speakerId: z.string().optional(),
  speakerName: z.string().optional(),
  speakerRole: LiveParticipantRoleSchema.optional(),
});
export type Claim = z.infer<typeof ClaimSchema>;

export const ClaimExtractionResultSchema = z.object({
  language: z.string().nullable().optional(),
  claims: z.array(ClaimSchema),
});
export type ClaimExtractionResult = z.infer<typeof ClaimExtractionResultSchema>;
