import type { Lang } from "./fallacies";
import type {
  PaperLedger,
  PaperResearch,
  PaperReviewResult,
} from "./paper-review-schema";
import type {
  ComputationAuditItem,
  QualityAudit,
  SpecsCriterion,
  SpecsStageResult,
} from "./paper-review-audit-schema";
import {
  venueProfileForPrompt,
  type ResolvedVenueProfile,
} from "./venues";

const OUTPUT_LANGUAGE: Record<Lang, string> = {
  en: "English",
  pt: "Brazilian Portuguese",
  es: "Spanish",
};

export function paperReviewContract(lang: Lang): string {
  return `You are a senior program-committee member and area chair acting as a gatekeeper, not as the author's collaborator.

Review exactly one autonomous PDF manuscript. Never request, retrieve, open, or compare companion papers, programme papers, previous versions, or other manuscripts by the author. Use external published literature only to verify claims, citations, novelty, correctness, and significance. If a central claim depends on another manuscript by the author, record that as a failure of autonomy and do not cross-check it.

Judgment rules:
- Judge against the target venue's published standard, not the manuscript's aspirations.
- Ask of every structural claim: is it correct, and is it non-trivial?
- Distinguish argument from assertion and citation-as-interlocutor from citation-as-endorsement.
- Separate proposal, specification, implementation, executed experiment, and empirical result.
- Require novelty to be established against precise published prior work.
- Locate every substantive criticism by page and, when available, section.
- Before retaining an internal contradiction, search for an explicit qualifier that reconciles it.
- Do not infer absent claims, rewrite the paper, or act as a collaborator.
- Be rigorous without praise inflation.
- Write all prose in ${OUTPUT_LANGUAGE[lang]}. Preserve the mandatory English recommendation labels exactly.`;
}

export function buildLedgerPrompt(paper: string): string {
  return `Read the complete page-tagged manuscript below, including references and appendices. Build a private evidence ledger for later review.

Extract construct definitions; necessary, sufficient, causal, empirical, quantitative, novelty, and significance claims; unit of analysis and system boundary; hypotheses; factors, arms, and controls; metrics and outcomes; falsification conditions; limitations and exclusions.

Candidate internal problems must use one of the required classifications. For a contradiction, name at least two localized passages and explain why an explicit qualifier does not reconcile them. Locations must look like "p. 7, §4.2" or at minimum "p. 7". Do not produce the final review yet.

MANUSCRIPT:
${paper}`;
}

export function buildResearchPrompt(
  ledger: PaperLedger,
  venueProfile: ResolvedVenueProfile,
): string {
  const structuralClaims = ledger.claims
    .filter((claim) => claim.structural)
    .map((claim) => `- ${claim.id}: ${claim.statement}`)
    .join("\n");

  return `Conduct an adversarial novelty, significance, and venue-fit check for an autonomous manuscript.

TARGET VENUE STANDARD:
${venueProfileForPrompt(venueProfile)}

Manuscript title: ${ledger.paperTitle}
Manuscript author(s): ${ledger.author}
Central contribution: ${ledger.centralContribution}
Structural claims:
${structuralClaims || "- None extracted"}

You MUST search the web. Search by technical concepts and exact claims, not by the manuscript title or author names. Do not retrieve or compare other manuscripts, preprints, programme papers, repositories, or project pages by these authors. Use primary published sources: peer-reviewed papers/proceedings, standards, and official technical documentation. An arXiv-only preprint may provide context but must not establish a published-prior-art conclusion.

Identify the closest published work and state precisely what this manuscript adds, combines, changes, or fails to distinguish. Separate weak novelty from incorrectness. Return a dense research memo with inline Markdown links.`;
}

export function buildInitialReviewPrompt(args: {
  paper: string;
  ledger: PaperLedger;
  research: PaperResearch;
  specs: SpecsStageResult[];
  computations: ComputationAuditItem[];
  venueProfile: ResolvedVenueProfile;
  reviewDate: string;
}): string {
  return `Produce the complete initial adversarial review from the manuscript, ledger, and external-literature memo.

TARGET VENUE STANDARD:
${venueProfileForPrompt(args.venueProfile)}

Review date: ${args.reviewDate}

Severity:
- MAJOR: threatens the central contribution, validity, novelty, architecture, main experiment, or global interpretation.
- MODERATE: requires substantive change but does not alone defeat the central contribution.
- MINOR: localized precision, presentation, or verifiability problem.

Requirements:
- Stage findings must each be one dense paragraph.
- Strengths must cite specific manuscript locations.
- Weaknesses must be exhaustive, ordered by severity, and numbered W1, W2, ...
- Every weakness must list the specialist finding IDs it consolidates in sourceFindingIds. Use [] only for a genuinely new synthesis finding.
- Retain every MAJOR or MODERATE specialist finding marked retainInFinal unless the evidence in the supplied artifacts clearly disproves it.
- Every weakness must carry localized manuscript evidence.
- Questions must be concrete and diagnostic of weaknesses.
- Overall assessment must name the most fundamental problem.
- publicationPath must be a short numbered path to publication, represented as an array in execution order.
- Apply each supplied venue criterion explicitly. Do not invent venue requirements beyond the supplied profile.
- If the profile is unverified, state venue-fit conclusions cautiously and apply only the supplied general scholarly standard.
- Significance must include links from the research memo.
- Sources must contain every external URL actually relied upon.
- Do not expose the private ledger.

PRIVATE LEDGER:
${JSON.stringify(args.ledger)}

EXTERNAL-LITERATURE MEMO:
${args.research.synthesis}

INDEPENDENT SPECS REVIEWS:
${JSON.stringify(args.specs)}

DETERMINISTIC COMPUTATION AUDIT:
${JSON.stringify(args.computations)}

MANUSCRIPT:
${args.paper}`;
}

export function buildSelfCritiquePrompt(args: {
  paper: string;
  ledger: PaperLedger;
  research: PaperResearch;
  specs: SpecsStageResult[];
  computations: ComputationAuditItem[];
  initialReview: PaperReviewResult;
  venueProfile: ResolvedVenueProfile;
  reviewDate: string;
}): string {
  return `Act as a second, more skeptical reviewer. Audit the initial review and return only the corrected final review.

Check:
- What weakness did the first pass miss?
- Was an unresolved objection praised?
- Did a contested structural premise pass without defense?
- Did an empirical claim escape a verification requirement?
- Is a necessary figure, table, schema, taxonomy, architecture, or conditions matrix missing?
- Does any alleged contradiction disappear under an explicit qualifier?
- Was any severity inflated or reduced?
- Does every retained criticism have localized evidence?
- Does any conclusion exceed what the experiment tests?
- Are novelty conclusions grounded only in external published sources?
- Did the first pass actually apply every supplied venue criterion?
- Did it invent a venue rule that is absent from the supplied profile?
- Did it omit a MAJOR or MODERATE specialist finding marked retainInFinal?
- Does every weakness preserve the relevant sourceFindingIds?
- Does it accurately report deterministic computation failures without overstating what a calculator can establish?

Do not mention this self-critique or the initial review. Preserve the mandatory recommendation labels and return a complete replacement review.

TARGET VENUE STANDARD:
${venueProfileForPrompt(args.venueProfile)}

Review date: ${args.reviewDate}

LEDGER:
${JSON.stringify(args.ledger)}

EXTERNAL-LITERATURE MEMO:
${args.research.synthesis}

INDEPENDENT SPECS REVIEWS:
${JSON.stringify(args.specs)}

DETERMINISTIC COMPUTATION AUDIT:
${JSON.stringify(args.computations)}

INITIAL REVIEW:
${JSON.stringify(args.initialReview)}

MANUSCRIPT:
${args.paper}`;
}

const CRITERION_INSTRUCTIONS: Record<SpecsCriterion, string> = {
  story:
    "Audit the problem framing, motivation, chain of argument, construct definitions, scope, stated contribution, hypotheses, and whether the paper tells a coherent and autonomous scientific story.",
  presentation:
    "Audit organization, precision, terminology, figures, tables, algorithms, schemas, reproducibility information, accessibility, and whether visual evidence supports the prose.",
  evaluations:
    "Audit datasets, factors, arms, controls, baselines, ablations, metrics, uncertainty, statistical tests, power, leakage, robustness, generalization, and whether experiments can falsify the claims.",
  correctness:
    "Audit logical validity, mathematical derivations, quantitative claims, internal consistency, implementation claims, units, denominators, and whether conclusions follow from the evidence.",
  significance:
    "Audit novelty, importance, practical or scientific impact, venue fit, and differentiation from the closest published prior work. Use the supplied research memo and do not treat an arXiv-only preprint as published prior art.",
};

const CRITERION_PREFIX: Record<SpecsCriterion, string> = {
  story: "S",
  presentation: "P",
  evaluations: "E",
  correctness: "C",
  significance: "G",
};

export function buildSpecsStagePrompt(args: {
  criterion: SpecsCriterion;
  paper: string;
  ledger: PaperLedger;
  research?: PaperResearch;
  venueProfile: ResolvedVenueProfile;
}): string {
  const prefix = CRITERION_PREFIX[args.criterion];
  return `Act as the independent SPECS specialist for ${args.criterion.toUpperCase()}.

${CRITERION_INSTRUCTIONS[args.criterion]}

Return only findings within your assigned criterion. Use IDs ${prefix}1, ${prefix}2, ... in order. Each retained criticism must cite a manuscript page and should name ledger claim IDs when applicable. Set retainInFinal only when the issue is sufficiently evidenced to survive synthesis; do not inflate severity.

For Evaluations and Correctness, propose deterministic checks only when the paper prints all operands and a reported result. Never propose executing manuscript code. Available operations and operand order:
- sum/product/mean: all values
- difference/quotient/percentage: [numerator or first value, denominator or second value]
- percentage_change: [old, new]
- weighted_mean: values plus equal-length weights
- precision: [true positives, false positives]
- recall: [true positives, false negatives]
- f1: [precision, recall] or [true positives, false positives, false negatives]
reportedValue must use the same scale as the operation (percentage returns 0–100; precision/recall/F1 return 0–1). Use an explicit absolute tolerance.

TARGET VENUE STANDARD:
${venueProfileForPrompt(args.venueProfile)}

PRIVATE LEDGER:
${JSON.stringify(args.ledger)}

${
  args.research
    ? `EXTERNAL-LITERATURE MEMO:\n${args.research.synthesis}\n`
    : ""
}
MANUSCRIPT:
${args.paper}`;
}

export function buildQualityAuditPrompt(args: {
  review: PaperReviewResult;
  specs: SpecsStageResult[];
  computations: ComputationAuditItem[];
  sources: PaperReviewResult["sources"];
}): string {
  return `Act as an independent area-chair quality auditor. You did not write the review. Audit it for unsupported conclusions, lost specialist findings, severity calibration, recommendation consistency, citation reliability, bias, anonymity violations, and editorial overreach.

For every specialist finding, return exactly one retain/dismiss decision. A dismissal requires a concrete reason grounded in the supplied artifacts. Flag as blocking any missing retained MAJOR/MODERATE finding, unsupported rejection rationale, source mismatch used materially, or recommendation that conflicts with the written assessment. Do not rewrite the review.

SPECS ARTIFACTS:
${JSON.stringify(args.specs)}

COMPUTATION AUDIT:
${JSON.stringify(args.computations)}

SOURCE AUDIT:
${JSON.stringify(args.sources)}

FINAL-DRAFT REVIEW:
${JSON.stringify(args.review)}`;
}

export function buildFinalRepairPrompt(args: {
  paper: string;
  ledger: PaperLedger;
  research: PaperResearch;
  specs: SpecsStageResult[];
  computations: ComputationAuditItem[];
  review: PaperReviewResult;
  quality: QualityAudit;
  missingFindingIds: string[];
  venueProfile: ResolvedVenueProfile;
  reviewDate: string;
}): string {
  return `Return a complete corrected final review. Resolve every blocking quality flag and explicitly incorporate every missing required specialist finding: ${args.missingFindingIds.join(", ") || "none"}.

Preserve sourceFindingIds when consolidating specialist findings. Do not mention this repair pass or expose private artifacts. Do not add claims unsupported by the manuscript. Keep the mandatory English recommendation labels.

TARGET VENUE STANDARD:
${venueProfileForPrompt(args.venueProfile)}
Review date: ${args.reviewDate}

LEDGER:
${JSON.stringify(args.ledger)}
EXTERNAL-LITERATURE MEMO:
${args.research.synthesis}
SPECS ARTIFACTS:
${JSON.stringify(args.specs)}
COMPUTATION AUDIT:
${JSON.stringify(args.computations)}
QUALITY AUDIT:
${JSON.stringify(args.quality)}
CURRENT REVIEW:
${JSON.stringify(args.review)}
MANUSCRIPT:
${args.paper}`;
}
