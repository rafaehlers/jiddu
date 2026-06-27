// Maps internal aggregates → the public REST/MCP response shapes.
// Pure functions; no I/O.

import { FALLACY_BY_ID } from "@/lib/fallacies";
import type { NeutralityIssue } from "@/lib/neutrality-schema";
import type { VerdictValue } from "@/lib/verdict-schema";
import type { ExplainLevel } from "@/lib/explain-schema";
import type {
  FallacyAggregate,
  NeutralityAggregate,
  ExplainAggregate,
  FactCheckAggregate,
} from "./run";

// ---------- Fallacies ----------

export type FallacyResponse = {
  fallacies: { name: string; excerpt: string; explanation: string }[];
  fallacy_count: number;
  verdict: "fallacies_found" | "clean";
};

export function mapFallacies(a: FallacyAggregate): FallacyResponse {
  const fallacies = a.findings.map((f) => ({
    // English label for a stable, machine-readable name; the explanation
    // itself is already in the requested language.
    name: FALLACY_BY_ID[f.fallacy]?.name.en ?? f.fallacy,
    excerpt: f.quote,
    explanation: f.explanation,
  }));
  return {
    fallacies,
    fallacy_count: fallacies.length,
    verdict: fallacies.length > 0 ? "fallacies_found" : "clean",
  };
}

// ---------- Fact-check ----------

export type PublicClaimVerdict = "true" | "false" | "unverifiable" | "misleading";

export type FactCheckResponse = {
  claims: {
    claim: string;
    verdict: PublicClaimVerdict;
    explanation: string;
    confidence: "high" | "medium" | "low";
  }[];
  overall_verdict: "reliable" | "questionable" | "unreliable";
  truncated?: boolean;
};

const PUBLIC_VERDICT: Record<VerdictValue, PublicClaimVerdict> = {
  supported: "true",
  contradicted: "false",
  mixed: "misleading",
  unverified: "unverifiable",
};

function confidenceBucket(c: number): "high" | "medium" | "low" {
  if (c >= 0.8) return "high";
  if (c >= 0.5) return "medium";
  return "low";
}

export function mapFactCheck(a: FactCheckAggregate): FactCheckResponse {
  const byId = new Map(a.verdicts.map((v) => [v.claimId, v]));
  const claims = a.claims.map((c) => {
    const v = byId.get(c.id);
    const internal = v?.verdict ?? "unverified";
    return {
      claim: c.statement,
      verdict: PUBLIC_VERDICT[internal],
      explanation: v?.rationale ?? "",
      confidence: confidenceBucket(v?.confidence ?? 0),
    };
  });

  const n = claims.length;
  const falseCount = claims.filter((c) => c.verdict === "false").length;
  const misleadingCount = claims.filter((c) => c.verdict === "misleading").length;
  const unverifiableCount = claims.filter((c) => c.verdict === "unverifiable").length;
  const trueCount = claims.filter((c) => c.verdict === "true").length;

  let overall: FactCheckResponse["overall_verdict"];
  if (n === 0) {
    // No checkable claims is not evidence of reliability.
    overall = "questionable";
  } else if (
    falseCount >= 1 &&
    (falseCount + misleadingCount >= Math.ceil(n / 2) || falseCount / n >= 0.34)
  ) {
    overall = "unreliable";
  } else if (falseCount >= 1 || misleadingCount >= 1 || unverifiableCount > trueCount) {
    overall = "questionable";
  } else {
    overall = "reliable";
  }

  return { claims, overall_verdict: overall, truncated: a.truncated };
}

// ---------- Neutrality ----------

export type NeutralitySignalType =
  | "loaded_language"
  | "one_sided"
  | "omission"
  | "framing";

export type NeutralityResponse = {
  score: number; // 0..1, 1 = perfectly neutral
  label: "neutral" | "mostly_neutral" | "biased" | "highly_biased";
  signals: {
    type: NeutralitySignalType;
    excerpt: string;
    explanation: string;
  }[];
  summary: string;
};

const ISSUE_TO_TYPE: Record<NeutralityIssue, NeutralitySignalType> = {
  loaded_language: "loaded_language",
  selective_omission: "omission",
  source_asymmetry: "one_sided",
  both_sidesing: "one_sided",
  asymmetric_attribution: "framing",
  false_equivalence: "framing",
  steering: "framing",
  genetic_framing: "framing",
};

const VERDICT_BASE: Record<NeutralityAggregate["verdict"], number> = {
  neutral: 0.9,
  partisan_lean: 0.6,
  explicitly_partisan: 0.3,
  manipulation: 0.1,
};

function neutralityLabel(score: number): NeutralityResponse["label"] {
  if (score >= 0.75) return "neutral";
  if (score >= 0.5) return "mostly_neutral";
  if (score >= 0.25) return "biased";
  return "highly_biased";
}

export function mapNeutrality(a: NeutralityAggregate): NeutralityResponse {
  const base = VERDICT_BASE[a.verdict];
  // Higher confidence pushes the score further from neutral (or, for a
  // neutral verdict, closer to perfectly neutral). Clamp to [0, 1].
  const adjust = (a.confidence - 0.5) * (a.verdict === "neutral" ? 0.1 : -0.15);
  const score = Math.max(0, Math.min(1, base + adjust));

  return {
    score: Math.round(score * 100) / 100,
    label: neutralityLabel(score),
    signals: a.findings.map((f) => ({
      type: ISSUE_TO_TYPE[f.issue],
      excerpt: f.quote,
      explanation: f.explanation,
    })),
    summary: a.rationale,
  };
}

// ---------- Explain ----------

export type ExplainResponse = {
  overview: string;
  level: ExplainLevel;
  paragraphs: { role: string; explanation: string }[];
};

export function mapExplain(a: ExplainAggregate, level: ExplainLevel): ExplainResponse {
  return {
    overview: a.overview,
    level,
    paragraphs: a.findings.map((f) => ({
      role: f.role,
      explanation: f.explanation,
    })),
  };
}
