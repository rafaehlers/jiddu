import { z } from "zod";

// The four explanation audiences the user picks before running. Each level
// changes assumed knowledge, terminology, reasoning depth, and prose structure.
export const EXPLAIN_LEVELS = [
  "eli5", // child — concrete explanation, everyday words, no assumed background
  "high_school", // high school — explicit reasoning, every field term defined
  "undergrad", // undergraduate — academic methods and standard terms assumed
  "expert", // expert — concise peer-level analysis, assumptions and limits foregrounded
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

// The dominant role each section plays in an academic paper.
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

// One explanation per substantive section. `blockIds` contains every
// paragraph anchor belonging to that section.
export const ExplainFindingSchema = z.object({
  blockIds: z.array(z.string()).min(1),
  role: RoleSchema,
  explanation: z.string(),
});
export type ExplainFinding = z.infer<typeof ExplainFindingSchema>;

// A concise, document-level reading map shown before the paragraph-by-
// paragraph explainer. Statements keep their supporting block ids so the
// reader can jump back to the paper instead of treating the synthesis as an
// untraceable model assertion.
export const PaperMapStatementSchema = z.object({
  text: z.string(),
  blockIds: z.array(z.string()),
});
export type PaperMapStatement = z.infer<typeof PaperMapStatementSchema>;

export const PaperQuickScanSchema = z.object({
  category: PaperMapStatementSchema.nullable(),
  context: PaperMapStatementSchema.nullable(),
  apparentCorrectness: PaperMapStatementSchema.nullable(),
  contributions: PaperMapStatementSchema.nullable(),
  clarity: PaperMapStatementSchema.nullable(),
});
export type PaperQuickScan = z.infer<typeof PaperQuickScanSchema>;

export const PaperEvidenceChainSchema = z.object({
  bigQuestion: PaperMapStatementSchema.nullable(),
  specificQuestion: PaperMapStatementSchema.nullable(),
  method: PaperMapStatementSchema.nullable(),
  result: PaperMapStatementSchema.nullable(),
  interpretation: PaperMapStatementSchema.nullable(),
  conclusion: PaperMapStatementSchema.nullable(),
});
export type PaperEvidenceChain = z.infer<typeof PaperEvidenceChainSchema>;

export const PaperReadingTermSchema = z.object({
  term: z.string(),
  meaning: z.string(),
  blockIds: z.array(z.string()),
});
export type PaperReadingTerm = z.infer<typeof PaperReadingTermSchema>;

export const PaperReadingNotebookSchema = z.object({
  keyTerms: z.array(PaperReadingTermSchema),
  questionsForAuthors: z.array(PaperMapStatementSchema),
  confusingPassages: z.array(PaperMapStatementSchema),
  implicitAssumptions: z.array(PaperMapStatementSchema),
  furtherReading: z.array(PaperMapStatementSchema),
});
export type PaperReadingNotebook = z.infer<typeof PaperReadingNotebookSchema>;

export const PaperVisualAuditItemSchema = z.object({
  pageNumber: z.number().int().positive(),
  label: z.string(),
  assessment: z.string(),
  concern: z.string().nullable(),
});
export type PaperVisualAuditItem = z.infer<typeof PaperVisualAuditItemSchema>;

export const PaperEvidenceFirstResultSchema = z.object({
  methodSummary: PaperMapStatementSchema.nullable(),
  resultSummary: PaperMapStatementSchema.nullable(),
  independentInterpretation: PaperMapStatementSchema.nullable(),
  uncertainties: z.array(PaperMapStatementSchema),
  visualAudit: z.array(PaperVisualAuditItemSchema),
});
export type PaperEvidenceFirstResult = z.infer<
  typeof PaperEvidenceFirstResultSchema
>;

export const PaperChallengeSchema = z.object({
  independentInterpretation: PaperMapStatementSchema.nullable(),
  authorsInterpretation: PaperMapStatementSchema.nullable(),
  comparison: PaperMapStatementSchema.nullable(),
  alignment: z.enum(["aligned", "partially_aligned", "divergent", "unclear"]),
  abstractFidelity: z
    .object({
      verdict: z.enum(["faithful", "partially_faithful", "misleading", "not_assessable"]),
      explanation: z.string(),
      blockIds: z.array(z.string()),
    })
    .nullable(),
  visualAudit: z.array(PaperVisualAuditItemSchema),
  uncertainties: z.array(PaperMapStatementSchema),
});
export type PaperChallenge = z.infer<typeof PaperChallengeSchema>;

export const PaperMapSchema = z.object({
  paperTypes: z.array(z.string()),
  contributionTypes: z.array(z.string()),
  researchQuestion: PaperMapStatementSchema.nullable(),
  contribution: PaperMapStatementSchema.nullable(),
  approach: PaperMapStatementSchema.nullable(),
  mainAnswer: PaperMapStatementSchema.nullable(),
  evidence: PaperMapStatementSchema.nullable(),
  statedLimitation: PaperMapStatementSchema.nullable(),
  // Optional for compatibility with analyses persisted before guided reading.
  quickScan: PaperQuickScanSchema.optional(),
  evidenceChain: PaperEvidenceChainSchema.optional(),
  notebook: PaperReadingNotebookSchema.optional(),
  challenge: PaperChallengeSchema.nullable().optional(),
});
export type PaperMap = z.infer<typeof PaperMapSchema>;

export const PaperSynthesisSchema = z.object({
  overview: z.string(),
  paperMap: PaperMapSchema,
});
export type PaperSynthesis = z.infer<typeof PaperSynthesisSchema>;

export function parsePaperMap(value: string | null | undefined): PaperMap | null {
  if (!value) return null;
  try {
    const parsed = PaperMapSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

// Tool schemas validate shape, but only the route knows the real block ids.
// Filter invented ids and empty labels before persisting the final map.
export function sanitizePaperSynthesis(
  synthesis: PaperSynthesis,
  validBlockIds: ReadonlySet<string>,
): PaperSynthesis {
  const cleanTags = (tags: string[]) =>
    Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean))).slice(0, 3);
  const cleanStatement = (
    statement: PaperMapStatement | null,
  ): PaperMapStatement | null => {
    if (!statement) return null;
    const text = statement.text.trim();
    if (!text) return null;
    return {
      text,
      blockIds: Array.from(
        new Set(statement.blockIds.filter((id) => validBlockIds.has(id))),
      ).slice(0, 6),
    };
  };
  const cleanStatements = (statements: PaperMapStatement[], limit: number) =>
    statements
      .map((statement) => cleanStatement(statement))
      .filter((statement): statement is PaperMapStatement => statement !== null)
      .slice(0, limit);
  const cleanQuickScan = (quickScan: PaperQuickScan | undefined) =>
    quickScan
      ? {
          category: cleanStatement(quickScan.category),
          context: cleanStatement(quickScan.context),
          apparentCorrectness: cleanStatement(quickScan.apparentCorrectness),
          contributions: cleanStatement(quickScan.contributions),
          clarity: cleanStatement(quickScan.clarity),
        }
      : undefined;
  const cleanEvidenceChain = (chain: PaperEvidenceChain | undefined) =>
    chain
      ? {
          bigQuestion: cleanStatement(chain.bigQuestion),
          specificQuestion: cleanStatement(chain.specificQuestion),
          method: cleanStatement(chain.method),
          result: cleanStatement(chain.result),
          interpretation: cleanStatement(chain.interpretation),
          conclusion: cleanStatement(chain.conclusion),
        }
      : undefined;
  const cleanVisualAudit = (items: PaperVisualAuditItem[]) =>
    items
      .map((item) => ({
        ...item,
        label: item.label.trim(),
        assessment: item.assessment.trim(),
        concern: item.concern?.trim() || null,
      }))
      .filter((item) => item.label && item.assessment)
      .slice(0, 8);
  const cleanNotebook = (notebook: PaperReadingNotebook | undefined) =>
    notebook
      ? {
          keyTerms: notebook.keyTerms
            .map((term) => ({
              term: term.term.trim(),
              meaning: term.meaning.trim(),
              blockIds: Array.from(
                new Set(term.blockIds.filter((id) => validBlockIds.has(id))),
              ).slice(0, 4),
            }))
            .filter((term) => term.term && term.meaning)
            .slice(0, 8),
          questionsForAuthors: cleanStatements(notebook.questionsForAuthors, 6),
          confusingPassages: cleanStatements(notebook.confusingPassages, 5),
          implicitAssumptions: cleanStatements(notebook.implicitAssumptions, 6),
          furtherReading: cleanStatements(notebook.furtherReading, 6),
        }
      : undefined;
  const cleanChallenge = (challenge: PaperChallenge | null | undefined) =>
    challenge
      ? {
          independentInterpretation: cleanStatement(
            challenge.independentInterpretation,
          ),
          authorsInterpretation: cleanStatement(challenge.authorsInterpretation),
          comparison: cleanStatement(challenge.comparison),
          alignment: challenge.alignment,
          abstractFidelity: challenge.abstractFidelity
            ? {
                verdict: challenge.abstractFidelity.verdict,
                explanation: challenge.abstractFidelity.explanation.trim(),
                blockIds: Array.from(
                  new Set(
                    challenge.abstractFidelity.blockIds.filter((id) =>
                      validBlockIds.has(id),
                    ),
                  ),
                ).slice(0, 6),
              }
            : null,
          visualAudit: cleanVisualAudit(challenge.visualAudit),
          uncertainties: cleanStatements(challenge.uncertainties, 6),
        }
      : null;

  return {
    overview: synthesis.overview.trim(),
    paperMap: {
      paperTypes: cleanTags(synthesis.paperMap.paperTypes),
      contributionTypes: cleanTags(synthesis.paperMap.contributionTypes),
      researchQuestion: cleanStatement(synthesis.paperMap.researchQuestion),
      contribution: cleanStatement(synthesis.paperMap.contribution),
      approach: cleanStatement(synthesis.paperMap.approach),
      mainAnswer: cleanStatement(synthesis.paperMap.mainAnswer),
      evidence: cleanStatement(synthesis.paperMap.evidence),
      statedLimitation: cleanStatement(synthesis.paperMap.statedLimitation),
      quickScan: cleanQuickScan(synthesis.paperMap.quickScan),
      evidenceChain: cleanEvidenceChain(synthesis.paperMap.evidenceChain),
      notebook: cleanNotebook(synthesis.paperMap.notebook),
      challenge: cleanChallenge(synthesis.paperMap.challenge),
    },
  };
}

export function sanitizePaperEvidenceFirstResult(
  result: PaperEvidenceFirstResult,
  validBlockIds: ReadonlySet<string>,
): PaperEvidenceFirstResult {
  const cleanStatement = (
    statement: PaperMapStatement | null,
  ): PaperMapStatement | null => {
    if (!statement?.text.trim()) return null;
    return {
      text: statement.text.trim(),
      blockIds: Array.from(
        new Set(statement.blockIds.filter((id) => validBlockIds.has(id))),
      ).slice(0, 6),
    };
  };
  return {
    methodSummary: cleanStatement(result.methodSummary),
    resultSummary: cleanStatement(result.resultSummary),
    independentInterpretation: cleanStatement(result.independentInterpretation),
    uncertainties: result.uncertainties
      .map((statement) => cleanStatement(statement))
      .filter((statement): statement is PaperMapStatement => statement !== null)
      .slice(0, 6),
    visualAudit: result.visualAudit
      .map((item) => ({
        ...item,
        label: item.label.trim(),
        assessment: item.assessment.trim(),
        concern: item.concern?.trim() || null,
      }))
      .filter((item) => item.label && item.assessment)
      .slice(0, 8),
  };
}

export const ExplainResultSchema = z.object({
  language: z.string().nullable().optional(),
  // A short plain-language abstract of the whole document at the chosen level.
  overview: z.string(),
  findings: z.array(ExplainFindingSchema),
});
export type ExplainResult = z.infer<typeof ExplainResultSchema>;
