/**
 * PolitiFact benchmark for Jiddu's verifyClaim pipeline.
 *
 * Loads the LIAR2 dataset (Apache-2.0, ~23k PolitiFact-labeled claims, 2008-2023),
 * filters to recent + extreme labels, samples claims stratified across the
 * four extreme buckets (true / mostly_true / false / pants_on_fire), and runs
 * the exact same sample through one or more models using `verifyClaim` with
 * cache reads and writes disabled. It reports quality, latency, cost, sources
 * and pairwise model disagreement against the mapping:
 *
 *   PolitiFact   →   Jiddu expected
 *   true (0)     →   supported
 *   mostly_true (1) → supported
 *   false (4)    →   contradicted
 *   pants_on_fire (5) → contradicted
 *
 * Jiddu verdicts of `mixed` or `unverified` are bucketed separately (neither
 * agreement nor disagreement against the polar mapping).
 *
 * Usage:
 *   npx tsx scripts/benchmark-politifact.mts
 *   npx tsx scripts/benchmark-politifact.mts --sample=24 \
 *     --models=perplexity/sonar,perplexity/sonar-reasoning-pro
 *
 * Requires `OPENROUTER_API_KEY` in .env. Writes:
 *   scripts/data/liar2-test.csv            (downloaded once, cached)
 *   scripts/data/bench-<timestamp>.json    (per-model results + A/B summary)
 */

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import { parse as parseCsv } from "csv-parse/sync";

// Load a colocated .env when available. CI and worktrees can provide the
// variables through the parent process without carrying a local file.
try {
  process.loadEnvFile?.();
} catch (error) {
  if (
    !error ||
    typeof error !== "object" ||
    !("code" in error) ||
    error.code !== "ENOENT"
  ) {
    throw error;
  }
}

if (!process.env.OPENROUTER_API_KEY) {
  console.error("[bench] OPENROUTER_API_KEY is not set. Aborting.");
  process.exit(1);
}

// The benchmark disables both verdict-cache reads and writes, but the shared
// verifier imports Prisma. Supply a non-routable placeholder when no database
// is configured so the paid model comparison remains database-independent.
process.env.DATABASE_URL ??=
  "postgresql://benchmark:benchmark@127.0.0.1:5432/benchmark";

const { verifyClaim } = await import("../src/lib/llm/verifyClaim");

// ─────────────────────────────────────────────────────────────────────────────
// Config

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const CSV_SOURCES = [
  {
    path: path.join(DATA_DIR, "liar2-train.csv"),
    url: "https://raw.githubusercontent.com/chengxuphd/liar2/main/liar2/train.csv",
  },
  {
    path: path.join(DATA_DIR, "liar2-valid.csv"),
    url: "https://raw.githubusercontent.com/chengxuphd/liar2/main/liar2/valid.csv",
  },
  {
    path: path.join(DATA_DIR, "liar2-test.csv"),
    url: "https://raw.githubusercontent.com/chengxuphd/liar2/main/liar2/test.csv",
  },
];

// LIAR2 label encoding — verified empirically against the README's count
// table (divided by 10 for the test split) and against sample statements:
//   0 = pants_on_fire (303 rows), 1 = false (660), 2 = mostly_false (360),
//   3 = half_true (371), 4 = mostly_true (343), 5 = true (259)
// The HuggingFace dataset card gives a misleading description (claims
// 0=True) that has tripped agents researching this dataset; the README
// count table + sample-text inspection is the authoritative source.
const LABEL_NAMES = [
  "pants_on_fire",
  "false",
  "mostly_false",
  "half_true",
  "mostly_true",
  "true",
] as const;
type LiarLabel = (typeof LABEL_NAMES)[number];

// We only benchmark the four polar buckets; mid-grade labels (half_true,
// mostly_false) are skipped because the human/LLM mapping in the middle is
// the noise zone documented in the Sahitaj 2025 paper.
const POLAR_LABELS: ReadonlyArray<LiarLabel> = [
  "true",
  "mostly_true",
  "false",
  "pants_on_fire",
];

// Expected Jiddu verdict for each PolitiFact label, used for agreement scoring.
const EXPECTED_JIDDU: Record<LiarLabel, "supported" | "contradicted"> = {
  true: "supported",
  mostly_true: "supported",
  half_true: "supported", // never sampled
  mostly_false: "contradicted", // never sampled
  false: "contradicted",
  pants_on_fire: "contradicted",
};

const PER_BUCKET = 50; // 50 × 4 = 200 claims for the full run
const CONCURRENCY = 6;
const SUPPORTED_MODELS = [
  "perplexity/sonar",
  "perplexity/sonar-reasoning-pro",
] as const;
type BenchmarkModel = (typeof SUPPORTED_MODELS)[number];
// 2020+ keeps the corpus modern enough that Perplexity's web search can
// still find live primary sources, but extends back far enough to give the
// "true" bucket (the rarest in PolitiFact's distribution) >100 candidates.
const MIN_YEAR = 2020;

// Deterministic shuffle seed so the same 200-claim sample is picked across
// reruns — important if we ever want to re-evaluate after a prompt change
// without changing which claims we're testing on.
const SHUFFLE_SEED = 0x6a696464; // "jidd"

// ─────────────────────────────────────────────────────────────────────────────
// Args

const args = new Map<string, string>();
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--(\w+)(?:=(.*))?$/);
  if (m) args.set(m[1], m[2] ?? "true");
}
const sampleOverride = args.has("sample") ? Number(args.get("sample")) : null;
const perBucket = sampleOverride
  ? Math.max(1, Math.floor(sampleOverride / POLAR_LABELS.length))
  : PER_BUCKET;
const totalTarget = perBucket * POLAR_LABELS.length;
const requestedModels = (args.get("models") ?? "perplexity/sonar-reasoning-pro")
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);
const models = Array.from(new Set(requestedModels)).map((model) => {
  if (!(SUPPORTED_MODELS as readonly string[]).includes(model)) {
    throw new Error(
      `[bench] unsupported model "${model}". Choose: ${SUPPORTED_MODELS.join(", ")}`,
    );
  }
  return model as BenchmarkModel;
});
if (models.length === 0) {
  throw new Error("[bench] provide at least one model with --models=...");
}

// ─────────────────────────────────────────────────────────────────────────────
// Dataset loading

type LiarRow = {
  id: string;
  label: LiarLabel;
  statement: string;
  date: string;
  year: number;
  speaker: string;
  context: string;
};

async function loadDataset(): Promise<LiarRow[]> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const out: LiarRow[] = [];
  for (const src of CSV_SOURCES) {
    try {
      await fs.access(src.path);
    } catch {
      console.log(`[bench] downloading ${path.basename(src.path)} from ${src.url}`);
      const res = await fetch(src.url);
      if (!res.ok) throw new Error(`LIAR2 download failed: ${res.status}`);
      const text = await res.text();
      await fs.writeFile(src.path, text);
      console.log(
        `[bench]   cached at ${src.path} (${text.length} bytes)`,
      );
    }
    const raw = await fs.readFile(src.path, "utf8");
    const records = parseCsv(raw, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
    }) as Array<Record<string, string>>;

    for (const r of records) {
      const labelIdx = Number(r.label);
      if (!Number.isInteger(labelIdx) || labelIdx < 0 || labelIdx > 5) continue;
      const label = LABEL_NAMES[labelIdx];
      const statement = (r.statement ?? "").trim();
      if (statement.length < 20) continue;
      const year = parseYear(r.date ?? "");
      if (year === null || year < MIN_YEAR) continue;
      out.push({
        id: String(r.id ?? ""),
        label,
        statement,
        date: r.date ?? "",
        year,
        speaker: (r.speaker ?? "").trim(),
        context: (r.context ?? "").trim(),
      });
    }
  }
  return out;
}

function parseYear(dateStr: string): number | null {
  // LIAR2 dates look like "October 2, 2017" or "2022-10-02" or rarely empty.
  const m1 = dateStr.match(/\b(20\d{2}|19\d{2})\b/);
  if (m1) return Number(m1[1]);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sampling

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function stratifiedSample(rows: LiarRow[]): LiarRow[] {
  const rand = mulberry32(SHUFFLE_SEED);
  const buckets = new Map<LiarLabel, LiarRow[]>();
  for (const r of rows) {
    if (!POLAR_LABELS.includes(r.label)) continue;
    const list = buckets.get(r.label) ?? [];
    list.push(r);
    buckets.set(r.label, list);
  }
  const picked: LiarRow[] = [];
  for (const label of POLAR_LABELS) {
    const pool = buckets.get(label) ?? [];
    const shuffled = shuffle(pool, rand);
    const take = shuffled.slice(0, perBucket);
    if (take.length < perBucket) {
      console.warn(
        `[bench] only ${take.length} claims available for label "${label}" (wanted ${perBucket})`,
      );
    }
    picked.push(...take);
  }
  return picked;
}

// ─────────────────────────────────────────────────────────────────────────────
// Claim-type heuristic
// The verifier prompt mildly varies based on type. Best-effort mapping from
// statement text into one of our 5 claim types; an inaccurate type doesn't
// derail the verdict, it just slightly under-tunes the prompt.

type ClaimTypeT = "numeric" | "date" | "quote" | "causal" | "categorical";

function classifyClaim(statement: string): ClaimTypeT {
  const s = statement.toLowerCase();
  if (/\b\d/.test(s) && /(percent|%|million|billion|trillion|thousand|times)\b/.test(s))
    return "numeric";
  if (/[“"'].+[”"']/.test(statement) || /\bsaid\b|\bclaimed\b|\bstated\b/.test(s))
    return "quote";
  if (/\bbecause\b|\bcaused\b|\bled to\b|\bresult(ed|s) in\b|\bdue to\b/.test(s))
    return "causal";
  if (/\b(19|20)\d{2}\b/.test(s)) return "date";
  return "categorical";
}

// ─────────────────────────────────────────────────────────────────────────────
// Benchmark loop with bounded concurrency

type Outcome = {
  requestedModel: BenchmarkModel;
  actualModel: string | null;
  liarId: string;
  liarLabel: LiarLabel;
  statement: string;
  date: string;
  speaker: string;
  context: string;
  claimType: ClaimTypeT;
  expected: "supported" | "contradicted";
  jidduVerdict: "supported" | "contradicted" | "mixed" | "unverified" | "error";
  jidduConfidence: number | null;
  jidduRationale: string | null;
  jidduSourceCount: number | null;
  durationMs: number;
  providerCostUsd: number | null;
  promptTokens: number;
  completionTokens: number;
  reasoningTokens: number;
  error?: string;
};

async function runBenchmark(
  claims: LiarRow[],
  model: BenchmarkModel,
): Promise<Outcome[]> {
  const results: Outcome[] = new Array(claims.length);
  let cursor = 0;
  let completed = 0;
  let errors = 0;

  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= claims.length) return;
      const c = claims[i];
      const claimType = classifyClaim(c.statement);
      const t0 = Date.now();
      try {
        const v = await verifyClaim(
          {
            id: `liar2-${c.id}`,
            statement: c.statement,
            type: claimType,
            sentenceIds: ["s0"],
            rationale: "",
          },
          {
            lang: "en",
            force: true,
            persistCache: false,
            model,
          },
        );
        const usage = v.usage;
        results[i] = {
          requestedModel: model,
          actualModel: v.model,
          liarId: c.id,
          liarLabel: c.label,
          statement: c.statement,
          date: c.date,
          speaker: c.speaker,
          context: c.context,
          claimType,
          expected: EXPECTED_JIDDU[c.label] as "supported" | "contradicted",
          jidduVerdict: v.verdict,
          jidduConfidence: v.confidence,
          jidduRationale: v.rationale,
          jidduSourceCount: v.sources.length,
          durationMs: Date.now() - t0,
          providerCostUsd: usage?.costUsd ?? null,
          promptTokens: usage?.promptTokens ?? 0,
          completionTokens: usage?.completionTokens ?? 0,
          reasoningTokens: usage?.reasoningTokens ?? 0,
        };
      } catch (err) {
        errors++;
        results[i] = {
          requestedModel: model,
          actualModel: null,
          liarId: c.id,
          liarLabel: c.label,
          statement: c.statement,
          date: c.date,
          speaker: c.speaker,
          context: c.context,
          claimType,
          expected: EXPECTED_JIDDU[c.label] as "supported" | "contradicted",
          jidduVerdict: "error",
          jidduConfidence: null,
          jidduRationale: null,
          jidduSourceCount: null,
          durationMs: Date.now() - t0,
          providerCostUsd: null,
          promptTokens: 0,
          completionTokens: 0,
          reasoningTokens: 0,
          error: err instanceof Error ? err.message : String(err),
        };
      }
      completed++;
      if (completed % 5 === 0 || completed === claims.length) {
        process.stdout.write(
          `\r[bench] ${model}: ${completed}/${claims.length} done (${errors} errors)`,
        );
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  process.stdout.write("\n");
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary stats

function summarize(results: Outcome[]) {
  const ok = results.filter((r) => r.jidduVerdict !== "error");
  const errored = results.length - ok.length;

  // Headline: agreement = jidduVerdict matches expected polar verdict.
  const agreed = ok.filter((r) => r.jidduVerdict === r.expected).length;
  const disagreed = ok.filter(
    (r) =>
      (r.jidduVerdict === "supported" || r.jidduVerdict === "contradicted") &&
      r.jidduVerdict !== r.expected,
  ).length;
  const mixed = ok.filter((r) => r.jidduVerdict === "mixed").length;
  const unverified = ok.filter((r) => r.jidduVerdict === "unverified").length;

  // Confusion matrix: rows = PolitiFact label, cols = Jiddu verdict.
  const confusion: Record<
    LiarLabel,
    Record<"supported" | "contradicted" | "mixed" | "unverified", number>
  > = Object.fromEntries(
    POLAR_LABELS.map((l) => [
      l,
      { supported: 0, contradicted: 0, mixed: 0, unverified: 0 },
    ]),
  ) as never;
  for (const r of ok) {
    if (r.jidduVerdict === "error") continue;
    confusion[r.liarLabel][r.jidduVerdict]++;
  }

  // Per-type accuracy.
  const byType = new Map<ClaimTypeT, { total: number; agreed: number }>();
  for (const r of ok) {
    const row = byType.get(r.claimType) ?? { total: 0, agreed: 0 };
    row.total++;
    if (r.jidduVerdict === r.expected) row.agreed++;
    byType.set(r.claimType, row);
  }

  const meanDur = ok.length
    ? Math.round(ok.reduce((s, r) => s + r.durationMs, 0) / ok.length)
    : 0;
  const priced = ok.filter((row) => row.providerCostUsd !== null);
  const knownProviderCostUsd = priced.reduce(
    (sum, row) => sum + (row.providerCostUsd ?? 0),
    0,
  );
  const sourceCounts = ok
    .map((row) => row.jidduSourceCount)
    .filter((value): value is number => value !== null);
  const confidences = ok
    .map((row) => row.jidduConfidence)
    .filter((value): value is number => value !== null);

  return {
    total: results.length,
    succeeded: ok.length,
    errored,
    agreed,
    disagreed,
    mixed,
    unverified,
    agreementRate: ok.length ? agreed / ok.length : 0,
    disagreementRate: ok.length ? disagreed / ok.length : 0,
    mixedRate: ok.length ? mixed / ok.length : 0,
    unverifiedRate: ok.length ? unverified / ok.length : 0,
    meanCallMs: meanDur,
    medianCallMs: percentile(ok.map((row) => row.durationMs), 0.5),
    p95CallMs: percentile(ok.map((row) => row.durationMs), 0.95),
    pricedCalls: priced.length,
    knownProviderCostUsd,
    meanCostUsd:
      priced.length > 0 ? knownProviderCostUsd / priced.length : null,
    promptTokens: ok.reduce((sum, row) => sum + row.promptTokens, 0),
    completionTokens: ok.reduce(
      (sum, row) => sum + row.completionTokens,
      0,
    ),
    reasoningTokens: ok.reduce(
      (sum, row) => sum + row.reasoningTokens,
      0,
    ),
    meanSources:
      sourceCounts.length > 0
        ? sourceCounts.reduce((sum, value) => sum + value, 0) /
          sourceCounts.length
        : 0,
    zeroSourceCalls: sourceCounts.filter((value) => value === 0).length,
    meanConfidence:
      confidences.length > 0
        ? confidences.reduce((sum, value) => sum + value, 0) /
          confidences.length
        : 0,
    confusion,
    byType: Object.fromEntries(
      Array.from(byType.entries()).map(([k, v]) => [
        k,
        { ...v, rate: v.total ? v.agreed / v.total : 0 },
      ]),
    ),
  };
}

function percentile(values: number[], quantile: number): number {
  if (values.length === 0) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * quantile) - 1),
  );
  return Math.round(sorted[index]);
}

function fmtPct(x: number) {
  return `${(x * 100).toFixed(1)}%`;
}

function printSummary(
  model: BenchmarkModel,
  s: ReturnType<typeof summarize>,
) {
  console.log(`\n──────── ${model} ────────`);
  console.log(
    `Sample:        ${s.total} (${s.succeeded} ok, ${s.errored} errored)`,
  );
  console.log(`Agreement:     ${s.agreed} (${fmtPct(s.agreementRate)})`);
  console.log(`Disagreement:  ${s.disagreed} (${fmtPct(s.disagreementRate)})`);
  console.log(`Mixed:         ${s.mixed} (${fmtPct(s.mixedRate)})`);
  console.log(`Unverified:    ${s.unverified} (${fmtPct(s.unverifiedRate)})`);
  console.log(
    `Latency:       mean ${s.meanCallMs} ms · p50 ${s.medianCallMs} ms · p95 ${s.p95CallMs} ms`,
  );
  console.log(
    `Cost:          $${s.knownProviderCostUsd.toFixed(4)} across ${s.pricedCalls}/${s.succeeded} priced calls`,
  );
  console.log(
    `Sources:       mean ${s.meanSources.toFixed(1)} · ${s.zeroSourceCalls} calls with none`,
  );
  console.log("");
  console.log("Confusion (PolitiFact → Jiddu):");
  console.log("                       supp.  contr.   mix.   unv.");
  for (const label of POLAR_LABELS) {
    const c = s.confusion[label];
    console.log(
      `  ${label.padEnd(16)}  ${String(c.supported).padStart(5)}  ${String(c.contradicted).padStart(5)}  ${String(c.mixed).padStart(5)}  ${String(c.unverified).padStart(5)}`,
    );
  }
  console.log("");
  console.log("Per claim type:");
  for (const [type, v] of Object.entries(s.byType)) {
    const row = v as { total: number; agreed: number; rate: number };
    console.log(
      `  ${type.padEnd(14)}  ${row.agreed}/${row.total}  (${fmtPct(row.rate)})`,
    );
  }
  console.log("─────────────────────────────────────────────────────");
}

function compareRuns(a: Outcome[], b: Outcome[]) {
  const bByClaim = new Map(b.map((row) => [row.liarId, row]));
  const pairs = a
    .map((left) => ({ left, right: bByClaim.get(left.liarId) }))
    .filter(
      (pair): pair is { left: Outcome; right: Outcome } =>
        pair.right !== undefined &&
        pair.left.jidduVerdict !== "error" &&
        pair.right.jidduVerdict !== "error",
    );
  const correct = (row: Outcome) => row.jidduVerdict === row.expected;
  const leftOnlyCorrect = pairs.filter(
    ({ left, right }) => correct(left) && !correct(right),
  ).length;
  const rightOnlyCorrect = pairs.filter(
    ({ left, right }) => !correct(left) && correct(right),
  ).length;
  const sameVerdict = pairs.filter(
    ({ left, right }) => left.jidduVerdict === right.jidduVerdict,
  ).length;
  const leftSummary = summarize(a);
  const rightSummary = summarize(b);

  return {
    leftModel: a[0]?.requestedModel ?? null,
    rightModel: b[0]?.requestedModel ?? null,
    pairedClaims: pairs.length,
    sameVerdict,
    verdictAgreementRate: pairs.length ? sameVerdict / pairs.length : 0,
    bothCorrect: pairs.filter(
      ({ left, right }) => correct(left) && correct(right),
    ).length,
    leftOnlyCorrect,
    rightOnlyCorrect,
    neitherCorrect: pairs.filter(
      ({ left, right }) => !correct(left) && !correct(right),
    ).length,
    meanLatencyRatio:
      leftSummary.meanCallMs > 0
        ? rightSummary.meanCallMs / leftSummary.meanCallMs
        : null,
    p95LatencyRatio:
      leftSummary.p95CallMs > 0
        ? rightSummary.p95CallMs / leftSummary.p95CallMs
        : null,
    providerCostRatio:
      leftSummary.knownProviderCostUsd > 0
        ? rightSummary.knownProviderCostUsd /
          leftSummary.knownProviderCostUsd
        : null,
    leftCostSavingsRate:
      rightSummary.knownProviderCostUsd > 0
        ? 1 -
          leftSummary.knownProviderCostUsd /
            rightSummary.knownProviderCostUsd
        : null,
  };
}

function printComparison(comparison: ReturnType<typeof compareRuns>) {
  console.log("\n──────────────── A/B comparison ────────────────");
  console.log(`A: ${comparison.leftModel}`);
  console.log(`B: ${comparison.rightModel}`);
  console.log(`Paired claims: ${comparison.pairedClaims}`);
  console.log(
    `Same verdict:  ${comparison.sameVerdict} (${fmtPct(comparison.verdictAgreementRate)})`,
  );
  console.log(`Both correct:   ${comparison.bothCorrect}`);
  console.log(`Only A correct: ${comparison.leftOnlyCorrect}`);
  console.log(`Only B correct: ${comparison.rightOnlyCorrect}`);
  console.log(`Neither:        ${comparison.neitherCorrect}`);
  if (comparison.meanLatencyRatio !== null) {
    console.log(
      `Mean latency:  B is ${comparison.meanLatencyRatio.toFixed(2)}× A`,
    );
  }
  if (comparison.providerCostRatio !== null) {
    console.log(
      `Provider cost: B is ${comparison.providerCostRatio.toFixed(2)}× A (${fmtPct(comparison.leftCostSavingsRate ?? 0)} saved with A)`,
    );
  }
  console.log("────────────────────────────────────────────────");
}

// ─────────────────────────────────────────────────────────────────────────────
// Main

const t0 = Date.now();
console.log(
  `[bench] PolitiFact benchmark — ${models.length} model(s) × ${totalTarget} claims (${perBucket}/bucket × ${POLAR_LABELS.length} buckets)`,
);
console.log(`[bench] models: ${models.join(", ")}`);

const rows = await loadDataset();
console.log(`[bench] dataset: ${rows.length} eligible claims (>= ${MIN_YEAR})`);

const sample = stratifiedSample(rows);
console.log(`[bench] sampled: ${sample.length} claims`);

if (sample.length === 0) {
  console.error("[bench] no claims sampled — check filters");
  process.exit(1);
}

const runs: Array<{
  model: BenchmarkModel;
  summary: ReturnType<typeof summarize>;
  results: Outcome[];
}> = [];
for (const model of models) {
  console.log(`\n[bench] running ${model}`);
  const results = await runBenchmark(sample, model);
  const summary = summarize(results);
  runs.push({ model, summary, results });
  printSummary(model, summary);
}
const comparisons = runs.slice(1).map((run) => {
  const comparison = compareRuns(runs[0].results, run.results);
  printComparison(comparison);
  return comparison;
});

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outPath = path.join(DATA_DIR, `bench-${stamp}.json`);
await fs.writeFile(
  outPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      sample: {
        total: sample.length,
        perBucket,
        labels: POLAR_LABELS,
        minimumYear: MIN_YEAR,
        shuffleSeed: SHUFFLE_SEED,
      },
      models,
      runs,
      comparisons,
    },
    null,
    2,
  ),
);
console.log(
  `[bench] saved ${runs.reduce((sum, run) => sum + run.results.length, 0)} results to ${outPath}`,
);
console.log(`[bench] total wall-clock: ${Math.round((Date.now() - t0) / 1000)}s`);
