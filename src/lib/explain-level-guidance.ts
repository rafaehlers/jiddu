import type { ExplainLevel } from "./explain-schema";

export type ExplanationLevelProfile = Readonly<{
  audience: string;
  assumedKnowledge: string;
  reasoningDepth: string;
  terminology: string;
  avoid: string;
  sentenceWordTarget: readonly [number, number];
  sentenceWordCeiling: number;
  overviewSentences: readonly [number, number];
  findingSentences: readonly [number, number];
}>;

export const EXPLANATION_LEVEL_PROFILES = {
  eli5: {
    audience: "a bright, curious 10-year-old",
    assumedKnowledge:
      "Assume no academic or field-specific background. Build from familiar ideas.",
    reasoningDepth:
      "Explain the central idea, the immediate reason for it, and why it matters. Use a concrete analogy only when it preserves the source's meaning.",
    terminology:
      "Prefer everyday words. If a technical term is necessary, define it in plain words in the same sentence.",
    avoid:
      "Do not use baby talk, unexplained jargon, or an analogy that adds facts not present in the source.",
    sentenceWordTarget: [8, 16],
    sentenceWordCeiling: 20,
    overviewSentences: [2, 3],
    findingSentences: [2, 4],
  },
  high_school: {
    audience: "a motivated high-school student without specialist training",
    assumedKnowledge:
      "Assume general school knowledge, but do not assume familiarity with research methods, statistics, or the paper's field.",
    reasoningDepth:
      "Make the reasoning explicit: state the claim, the support or cause, and why it matters. Restate abstract ideas concretely without inventing examples.",
    terminology:
      "Use necessary technical terms, but define each field-specific term in plain words the first time it appears.",
    avoid:
      "Do not turn the explanation into a children's story, and do not assume college-level methods or vocabulary.",
    sentenceWordTarget: [12, 20],
    sentenceWordCeiling: 25,
    overviewSentences: [2, 3],
    findingSentences: [3, 5],
  },
  undergrad: {
    audience: "an undergraduate in a related field",
    assumedKnowledge:
      "Assume general academic vocabulary, introductory research methods, and foundational concepts from the field.",
    reasoningDepth:
      "Explain what the section contributes, how it connects to the paper's argument, why the authors chose this approach, and what follows from that choice.",
    terminology:
      "Retain precise standard terminology. Define only paper-specific or genuinely specialized terms.",
    avoid:
      "Do not make the prose difficult merely to sound academic, and do not spend sentences defining standard introductory terms.",
    sentenceWordTarget: [16, 25],
    sentenceWordCeiling: 30,
    overviewSentences: [2, 4],
    findingSentences: [3, 6],
  },
  expert: {
    audience: "a domain expert",
    assumedKnowledge:
      "Assume full command of the field's standard concepts, methods, and terminology.",
    reasoningDepth:
      "Lead with what is novel or decisive. Surface assumptions, evidence strength, limitations, and how the section advances or constrains the contribution.",
    terminology:
      "Retain precise domain terminology and skip basic definitions.",
    avoid:
      "Do not recap basics, add generic significance claims, or introduce criticism that requires evidence outside the supplied text.",
    sentenceWordTarget: [12, 22],
    sentenceWordCeiling: 28,
    overviewSentences: [2, 3],
    findingSentences: [2, 4],
  },
} as const satisfies Record<ExplainLevel, ExplanationLevelProfile>;

export const CONTROLLED_CLARITY_GUIDANCE = `CONTROLLED CLARITY RULES:
- Give each sentence one main idea. Split long chains of clauses into separate sentences.
- Prefer active voice when the actor matters. Name the actor instead of hiding responsibility.
- Keep references explicit. Avoid vague pronouns such as "this" or "it", and their equivalents in the output language, when the referent could be unclear.
- Use one consistent term for one concept. Do not rotate synonyms only for stylistic variety.
- Preserve every fact, number, comparison, condition, negation, uncertainty, and scope qualifier from the source.
- Never make the text easier by deleting necessary reasoning. If clarity and brevity conflict, preserve the meaning and split the sentence.`;

export function getExplanationLevelProfile(
  level: ExplainLevel,
): ExplanationLevelProfile {
  return EXPLANATION_LEVEL_PROFILES[level];
}

export function buildExplanationLevelGuidance(level: ExplainLevel): string {
  const profile = getExplanationLevelProfile(level);
  const [minimumWords, targetWords] = profile.sentenceWordTarget;

  return `AUDIENCE: Write for ${profile.audience}.
ASSUMED KNOWLEDGE: ${profile.assumedKnowledge}
DEPTH: ${profile.reasoningDepth}
TERMINOLOGY: ${profile.terminology}
AVOID: ${profile.avoid}
SENTENCES: Aim for ${minimumWords} to ${targetWords} words per sentence. Do not exceed ${profile.sentenceWordCeiling} words unless an exact quotation or indivisible technical name makes that impossible.`;
}

export function formatSentenceRange(range: readonly [number, number]): string {
  const [minimum, maximum] = range;
  return minimum === maximum
    ? `${minimum} sentences`
    : `${minimum} to ${maximum} sentences`;
}
