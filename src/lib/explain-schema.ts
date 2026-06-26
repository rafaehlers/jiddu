import { z } from "zod";

// The four explanation audiences the user picks before running. Each level
// only changes the *vocabulary and depth* of the explanation prose — the
// pipeline (paragraph segmentation, section-role tagging) is identical.
export const EXPLAIN_LEVELS = [
  "eli5", // a curious child / general public — everyday words, analogies
  "high_school", // bright high-schooler — defines field terms
  "undergrad", // undergraduate in a related field — assumes academic vocab
  "expert", // domain expert — concise, critical, no basic definitions
] as const;
export type ExplainLevel = (typeof EXPLAIN_LEVELS)[number];

const DEFAULT_LEVEL: ExplainLevel = "undergrad";

// Lenient coercion so the route never rejects a slightly-off level string.
export function normalizeLevel(v: unknown): ExplainLevel {
  if (typeof v !== "string") return DEFAULT_LEVEL;
  const s = v.toLowerCase().trim().replace(/[\s-]+/g, "_");
  if ((EXPLAIN_LEVELS as readonly string[]).includes(s)) return s as ExplainLevel;
  if (["child", "kid", "eli5", "elementary", "primary"].includes(s)) return "eli5";
  if (["highschool", "secondary", "school"].includes(s)) return "high_school";
  if (["college", "undergraduate", "graduation", "bachelor"].includes(s)) return "undergrad";
  if (["phd", "grad", "graduate", "specialist", "researcher"].includes(s)) return "expert";
  return DEFAULT_LEVEL;
}

// The role each paragraph plays in an academic paper. The color attached to
// each role (defined in the viewer) becomes the in-text highlight + legend,
// so the reader can see a paper's skeleton at a glance.
export const SECTION_ROLES = [
  "background", // context, motivation, prior work, problem statement
  "objective", // research question, hypothesis, aim, contribution claim
  "method", // data, materials, procedure, model, experimental setup
  "result", // findings, measurements, observations, evidence
  "interpretation", // discussion, what the results mean, implications
  "limitation", // caveats, threats to validity, weaknesses
  "conclusion", // summary takeaway, future work, closing remarks
] as const;
export type SectionRole = (typeof SECTION_ROLES)[number];

// Models routinely return a near-synonym; map the common ones back.
const RoleSchema = z.preprocess((v) => {
  if (typeof v !== "string") return "background";
  const s = v.toLowerCase().trim().replace(/[\s-]+/g, "_");
  if ((SECTION_ROLES as readonly string[]).includes(s)) return s;
  if (["introduction", "intro", "context", "motivation", "related_work", "prior_work", "problem"].includes(s))
    return "background";
  if (["aim", "goal", "hypothesis", "research_question", "question", "contribution", "objectives"].includes(s))
    return "objective";
  if (["methods", "methodology", "approach", "data", "materials", "procedure", "setup", "design"].includes(s))
    return "method";
  if (["results", "findings", "observations", "evidence", "measurements"].includes(s))
    return "result";
  if (["discussion", "implications", "implication", "analysis", "interpretation"].includes(s))
    return "interpretation";
  if (["limitations", "caveats", "threats", "weaknesses", "limitation"].includes(s))
    return "limitation";
  if (["conclusions", "summary", "future_work", "takeaway", "closing"].includes(s))
    return "conclusion";
  return "background";
}, z.enum(SECTION_ROLES));

// One explanation per (substantive) paragraph. `blockIds` points at the
// paragraph block(s) the explanation covers — usually exactly one.
export const ExplainFindingSchema = z.object({
  blockIds: z.array(z.string()).min(1),
  role: RoleSchema,
  explanation: z.string(),
});
export type ExplainFinding = z.infer<typeof ExplainFindingSchema>;

export const ExplainResultSchema = z.object({
  language: z.string().nullable().optional(),
  // A short plain-language abstract of the whole document at the chosen level.
  overview: z.string(),
  findings: z.array(ExplainFindingSchema),
});
export type ExplainResult = z.infer<typeof ExplainResultSchema>;
