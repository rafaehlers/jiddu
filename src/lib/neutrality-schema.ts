import { z } from "zod";
import { LiveParticipantRoleSchema } from "./live-analysis-config";

// Eight neutrality-failure patterns, distilled from Goldfarb et al.
// ("Distilling Expert Judgment at Scale", Forum AI / Stanford, 2025).
// These cover the most common ways that an outwardly factual text smuggles
// in a side without resorting to a textbook logical fallacy.
export const NEUTRALITY_ISSUES = [
  "loaded_language", // pejorative or laudatory word choice that pre-judges (e.g. "regime" vs "government")
  "asymmetric_attribution", // verb choice or framing makes one side feel more / less credible
  "false_equivalence", // weighting evidence-strong and evidence-weak claims as equal
  "selective_omission", // missing context that materially changes interpretation
  "source_asymmetry", // citing one side's experts without engaging the other
  "both_sidesing", // treating a question already settled by evidence as still contested
  "steering", // presenting one outcome of a reasonable disagreement as obviously correct
  "genetic_framing", // dismissing or elevating an argument by who voiced it, not its content
] as const;
export type NeutralityIssue = (typeof NEUTRALITY_ISSUES)[number];

// Severity mirrors the fallacy schema so the viewer can apply the same
// "low / high" visual treatment.
const SeveritySchema = z.preprocess((v) => {
  if (v === "low" || v === "high") return v;
  if (typeof v !== "string") return "low";
  const s = v.toLowerCase().trim();
  if (["high", "severe", "strong", "critical", "major", "serious"].includes(s)) return "high";
  if (["low", "mild", "minor", "weak", "medium", "moderate", "mid"].includes(s)) return "low";
  return "low";
}, z.enum(["low", "high"]));

// Lenient coercion of issue strings — Sonar/openai sometimes return synonyms.
const IssueSchema = z.preprocess((v) => {
  if (typeof v !== "string") return "loaded_language";
  const s = v.toLowerCase().trim().replace(/[\s-]+/g, "_");
  if ((NEUTRALITY_ISSUES as readonly string[]).includes(s)) return s;
  if (["loaded_word", "loaded_terms", "pejorative", "laudatory"].includes(s)) return "loaded_language";
  if (["attribution", "verb_framing"].includes(s)) return "asymmetric_attribution";
  if (["bothsides", "both_sides", "false_balance"].includes(s)) return "both_sidesing";
  if (["omission", "context_missing"].includes(s)) return "selective_omission";
  if (["one_sided_sources", "missing_voices"].includes(s)) return "source_asymmetry";
  if (["nudging", "guiding", "leading"].includes(s)) return "steering";
  if (["genetic_fallacy", "source_dismissal"].includes(s)) return "genetic_framing";
  return "loaded_language";
}, z.enum(NEUTRALITY_ISSUES));

export const NeutralityFindingSchema = z.object({
  sentenceIds: z.array(z.string()).min(1),
  issue: IssueSchema,
  severity: SeveritySchema,
  quote: z.string(),
  explanation: z.string(),
  speakerId: z.string().optional(),
  speakerName: z.string().optional(),
  speakerRole: LiveParticipantRoleSchema.optional(),
});
export type NeutralityFinding = z.infer<typeof NeutralityFindingSchema>;

// Text-type taxonomy from the paper. We capture it for context but treat
// it as informational metadata rather than as a gate (any text can be
// analyzed for neutrality; the type informs how strict we are).
export const TEXT_TYPES = [
  "informational",
  "opinion",
  "political_speech",
  "advocacy",
  "analysis",
  "marketing",
  "social_media",
] as const;
export type TextType = (typeof TEXT_TYPES)[number];

const TextTypeSchema = z.preprocess((v) => {
  if (typeof v !== "string") return "informational";
  const s = v.toLowerCase().trim().replace(/[\s-]+/g, "_");
  if ((TEXT_TYPES as readonly string[]).includes(s)) return s;
  if (["news", "report", "informative"].includes(s)) return "informational";
  if (["op_ed", "opinion_piece", "editorial"].includes(s)) return "opinion";
  if (["speech", "address", "remarks"].includes(s)) return "political_speech";
  if (["lobby", "activism", "campaign"].includes(s)) return "advocacy";
  if (["commentary", "analytical"].includes(s)) return "analysis";
  if (["marketing", "branded", "advertorial", "promotion"].includes(s)) return "marketing";
  if (["social", "tweet", "post"].includes(s)) return "social_media";
  return "informational";
}, z.enum(TEXT_TYPES));

// Overall verdict for the document.
export const NEUTRALITY_VERDICTS = [
  "neutral",
  "partisan_lean",
  "explicitly_partisan",
  "manipulation",
] as const;
export type NeutralityVerdictValue = (typeof NEUTRALITY_VERDICTS)[number];

const VerdictSchema = z.preprocess((v) => {
  if (typeof v !== "string") return "neutral";
  const s = v.toLowerCase().trim().replace(/[\s-]+/g, "_");
  if ((NEUTRALITY_VERDICTS as readonly string[]).includes(s)) return s;
  if (["fair", "balanced", "impartial"].includes(s)) return "neutral";
  if (["leaning", "biased", "slanted"].includes(s)) return "partisan_lean";
  if (["partisan", "advocacy"].includes(s)) return "explicitly_partisan";
  if (["propaganda", "manipulative", "manipulation"].includes(s)) return "manipulation";
  return "neutral";
}, z.enum(NEUTRALITY_VERDICTS));

export const NeutralityResultSchema = z.object({
  language: z.string().nullable().optional(),
  textType: TextTypeSchema,
  verdict: VerdictSchema,
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
  findings: z.array(NeutralityFindingSchema),
});
export type NeutralityResult = z.infer<typeof NeutralityResultSchema>;
