// Synchronous aggregation layer for the public REST API.
//
// The four analysis pipelines are streaming generators (SSE) in the web app.
// The public API is request→JSON, and its input is a single short text
// (40–2000 chars) that always fits in one chunk — so here we just drive each
// generator to completion and return a typed aggregate. No chunking, no DB
// row, no SSE. We still split into sentences/blocks because the prompts and
// findings reference per-unit ids (sN / pN).

import { getProvider } from "@/lib/llm";
import { DEFAULT_MODEL_CHAIN, withModelFallback } from "@/lib/llm/fallback";
import { verifyClaim, VERIFY_MODEL } from "@/lib/llm/verifyClaim";
import { ingestText } from "@/lib/ingest/text";
import { splitSentences } from "@/lib/sentences";
import { splitBlocks } from "@/lib/paragraphs";
import type { Lang } from "@/lib/fallacies";
import type { Finding } from "@/lib/schema";
import type { Claim } from "@/lib/claims-schema";
import type {
  NeutralityFinding,
  NeutralityVerdictValue,
  TextType,
} from "@/lib/neutrality-schema";
import type { ExplainFinding, ExplainLevel } from "@/lib/explain-schema";
import type { Verdict } from "@/lib/verdict-schema";

export type RunOpts = { lang?: Lang; signal?: AbortSignal };

const VERIFY_CONCURRENCY = 6;

// Build the default model chain (the public API does not expose model choice).
function modelChain(): string[] {
  return [...DEFAULT_MODEL_CHAIN];
}

// Shared prep: clean + validate the text (throws IngestError on <40 chars),
// then split into the requested unit. Returns the cleaned text too.
function prep(text: string): { text: string } {
  const doc = ingestText(text);
  return { text: doc.text };
}

// ---------- Fallacies ----------

export type FallacyAggregate = {
  findings: Finding[];
  score: number; // 0..100
  summary: string;
  language: string | null;
};

export async function runFallacies(
  text: string,
  opts?: RunOpts,
): Promise<FallacyAggregate> {
  const { text: clean } = prep(text);
  const lang = opts?.lang ?? "en";
  const sentences = splitSentences(clean);
  if (sentences.length === 0) throw new NoUnitsError();

  const chain = modelChain();
  const llm = getProvider(chain[0]);

  const findings: Finding[] = [];
  let score = 0;
  let summary = "";
  let language: string | null = null;

  for await (const ev of withModelFallback(
    chain,
    (model) => llm.analyzeStream({ sentences, lang }, { model, signal: opts?.signal }),
    opts?.signal,
  )) {
    if (ev.type === "finding") findings.push(ev.finding);
    else if (ev.type === "summary") summary = ev.summary;
    else if (ev.type === "score") score = ev.score;
    else if (ev.type === "language") language = ev.language;
  }

  return { findings, score, summary, language };
}

// ---------- Neutrality ----------

export type NeutralityAggregate = {
  findings: NeutralityFinding[];
  verdict: NeutralityVerdictValue;
  confidence: number; // 0..1
  rationale: string;
  textType: TextType;
  language: string | null;
};

export async function runNeutrality(
  text: string,
  opts?: RunOpts,
): Promise<NeutralityAggregate> {
  const { text: clean } = prep(text);
  const lang = opts?.lang ?? "en";
  const sentences = splitSentences(clean);
  if (sentences.length === 0) throw new NoUnitsError();

  const chain = modelChain();
  const llm = getProvider(chain[0]);

  const findings: NeutralityFinding[] = [];
  let verdict: NeutralityVerdictValue = "neutral";
  let confidence = 0;
  let rationale = "";
  let textType: TextType = "informational";
  let language: string | null = null;

  for await (const ev of withModelFallback(
    chain,
    (model) =>
      llm.analyzeNeutralityStream({ sentences, lang }, { model, signal: opts?.signal }),
    opts?.signal,
  )) {
    if (ev.type === "finding") findings.push(ev.finding);
    else if (ev.type === "verdict") {
      verdict = ev.verdict;
      confidence = ev.confidence;
      rationale = ev.rationale;
    } else if (ev.type === "textType") textType = ev.textType;
    else if (ev.type === "language") language = ev.language;
  }

  return { findings, verdict, confidence, rationale, textType, language };
}

// ---------- Explain ----------

export type ExplainAggregate = {
  overview: string;
  findings: ExplainFinding[];
  language: string | null;
};

export async function runExplain(
  text: string,
  opts?: RunOpts & { level?: ExplainLevel },
): Promise<ExplainAggregate> {
  const { text: clean } = prep(text);
  const lang = opts?.lang ?? "en";
  const level = opts?.level ?? "undergrad";
  const blocks = splitBlocks(clean);
  if (blocks.length === 0) throw new NoUnitsError();

  const chain = modelChain();
  const llm = getProvider(chain[0]);

  const findings: ExplainFinding[] = [];
  let overview = "";
  let language: string | null = null;

  for await (const ev of withModelFallback(
    chain,
    (model) => llm.explainStream({ sentences: blocks, lang }, { model, level, signal: opts?.signal }),
    opts?.signal,
  )) {
    if (ev.type === "finding") findings.push(ev.finding);
    else if (ev.type === "overview") overview = ev.overview;
    else if (ev.type === "language") language = ev.language;
  }

  return { overview, findings, language };
}

// ---------- Fact-check (extract + verify) ----------

export type FactCheckAggregate = {
  claims: (Claim & { id: string })[];
  verdicts: Verdict[]; // aligned by claimId
  language: string | null;
  truncated: boolean; // hit the claim cap
};

export async function runFactCheck(
  text: string,
  opts?: RunOpts & { maxClaims?: number },
): Promise<FactCheckAggregate> {
  const { text: clean } = prep(text);
  const lang = opts?.lang ?? "en";
  const maxClaims = Math.max(1, Math.floor(opts?.maxClaims ?? 10));
  const sentences = splitSentences(clean);
  if (sentences.length === 0) throw new NoUnitsError();

  const chain = modelChain();
  const llm = getProvider(chain[0]);

  // 1. Extract claims (assign stable ids, cap to maxClaims).
  const extracted: Claim[] = [];
  let language: string | null = null;
  for await (const ev of withModelFallback(
    chain,
    (model) => llm.extractClaimsStream({ sentences, lang }, { model, signal: opts?.signal }),
    opts?.signal,
  )) {
    if (ev.type === "claim") extracted.push(ev.claim);
    else if (ev.type === "language") language = ev.language;
  }

  const truncated = extracted.length > maxClaims;
  const claims = extracted
    .slice(0, maxClaims)
    .map((c, i) => ({ ...c, id: `c${i + 1}` }));

  // 2. Verify each claim (bounded concurrency). A per-claim failure becomes an
  //    "unverified" verdict so the claim still appears in the response.
  const verdicts: Verdict[] = new Array(claims.length);
  let cursor = 0;
  const worker = async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= claims.length) return;
      if (opts?.signal?.aborted) return;
      const claim = claims[idx];
      try {
        const r = await verifyClaim(claim, { lang, signal: opts?.signal });
        verdicts[idx] = {
          claimId: r.claimId,
          verdict: r.verdict,
          confidence: r.confidence,
          rationale: r.rationale,
          sources: r.sources,
          model: r.model,
        };
      } catch (err) {
        verdicts[idx] = {
          claimId: claim.id,
          verdict: "unverified",
          confidence: 0,
          rationale:
            err instanceof Error ? `Verification failed: ${err.message}` : "Verification failed.",
          sources: [],
          model: VERIFY_MODEL,
        };
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(VERIFY_CONCURRENCY, claims.length) }, worker),
  );

  return { claims, verdicts: verdicts.filter(Boolean), language, truncated };
}

// Thrown when the text has no analyzable units (sentences/blocks) after
// splitting — the route maps it to 422.
export class NoUnitsError extends Error {
  constructor() {
    super("No analyzable content detected in `text`");
    this.name = "NoUnitsError";
  }
}
