/**
 * Paid end-to-end smoke test for OpenRouter model routing and PostgreSQL.
 *
 * Required environment:
 *   OPENROUTER_API_KEY
 *   DATABASE_URL pointing to a disposable PostgreSQL database
 *
 * Run:
 *   DATABASE_URL=postgresql://... npm run smoke:openrouter-postgres
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { nanoid } from "nanoid";
import { prisma } from "../src/lib/db";
import { claimCacheKey } from "../src/lib/factcheck/cache";
import {
  MODEL_CATALOG,
  OpenRouterProvider,
} from "../src/lib/llm/openrouter";
import { verifyClaim } from "../src/lib/llm/verifyClaim";
import {
  runPreparedPaperReview,
  type PreparedPaperReview,
} from "../src/lib/paper-review-job";
import type { OpenRouterUsage } from "../src/lib/openrouter-usage";
import type { Sentence } from "../src/lib/schema";
import { resolveVenueProfile } from "../src/lib/venues";

type SmokeResult = {
  mode: string;
  model: string;
  durationMs: number;
  providerCostUsd: number | null;
  promptTokens: number;
  completionTokens: number;
  reasoningTokens: number;
  detail: string;
};

type StreamEvent = { type: string };

const ownerWorkosUserId = `smoke-openrouter-postgres-${nanoid(8)}`;
const smokeProvider = process.env.SMOKE_OPENROUTER_PROVIDER?.trim();
if (smokeProvider && MODEL_CATALOG[0]) {
  MODEL_CATALOG[0].providerOrder = [smokeProvider];
}
const provider = new OpenRouterProvider("gpt-5.6-luna");
const results: SmokeResult[] = [];
const claimCacheHashes = new Set<string>();

function sentence(id: string, text: string): Sentence {
  return { id, start: 0, end: text.length, text };
}

async function withTransientRetry<T>(
  label: string,
  operation: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      console.warn(
        `[${label}] transient attempt ${attempt}/${attempts} failed; retrying`,
      );
      await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
    }
  }
  throw lastError;
}

async function consume<T extends StreamEvent>(
  stream: AsyncGenerator<T, { model: string }, void>,
): Promise<{ events: T[]; model: string }> {
  const events: T[] = [];
  while (true) {
    const next = await stream.next();
    if (next.done) return { events, model: next.value.model };
    events.push(next.value);
  }
}

function usageSummary(usages: readonly OpenRouterUsage[]) {
  const priced = usages.filter((usage) => usage.costUsd !== null);
  return {
    providerCostUsd:
      priced.length > 0
        ? priced.reduce((sum, usage) => sum + (usage.costUsd ?? 0), 0)
        : null,
    promptTokens: usages.reduce((sum, usage) => sum + usage.promptTokens, 0),
    completionTokens: usages.reduce(
      (sum, usage) => sum + usage.completionTokens,
      0,
    ),
    reasoningTokens: usages.reduce(
      (sum, usage) => sum + usage.reasoningTokens,
      0,
    ),
  };
}

function addResult(input: {
  mode: string;
  model: string;
  startedAt: number;
  usages: readonly OpenRouterUsage[];
  detail: string;
}) {
  results.push({
    mode: input.mode,
    model: input.model,
    durationMs: Date.now() - input.startedAt,
    ...usageSummary(input.usages),
    detail: input.detail,
  });
}

async function smokeFallacy(source: "paste" | "live") {
  const mode = source === "live" ? "live-analysis" : "fallacy";
  const text =
    source === "live"
      ? "Everybody agrees this proposal is perfect, so anyone opposing it must hate progress."
      : "Millions of people believe this supplement works, therefore it must cure the disease.";
  const inputSentences = [sentence(`${mode}-1`, text)];
  const startedAt = Date.now();
  const output = await withTransientRetry(mode, () =>
    provider.analyze({ sentences: inputSentences, lang: "en" }),
  );
  assert.equal(output.model, "gpt-5.6-luna");
  assert.ok(output.result.findings.length > 0, `${mode} returned no finding`);

  const id = nanoid(10);
  await prisma.analysis.create({
    data: {
      id,
      ownerWorkosUserId,
      status: "complete",
      source,
      sourceRef: "OpenRouter/PostgreSQL smoke test",
      title: mode,
      text,
      language: "en",
      provider: output.provider,
      model: output.model,
      score: output.result.score,
      summary: output.result.summary,
      sentences: JSON.stringify(inputSentences),
      findings: JSON.stringify(output.result.findings),
      ...(source === "live" ? { transcript: text } : {}),
      finishedAt: new Date(),
    },
  });
  const stored = await prisma.analysis.findUniqueOrThrow({ where: { id } });
  assert.equal(stored.model, "gpt-5.6-luna");
  assert.equal(stored.status, "complete");

  addResult({
    mode,
    model: output.model,
    startedAt,
    usages: output.usage ? [output.usage] : [],
    detail: `${output.result.findings.length} finding(s), score ${output.result.score}`,
  });
}

async function smokeFactCheck() {
  const text = "Apollo 11 landed humans on the Moon in July 1969.";
  const inputSentences = [sentence("fact-1", text)];
  const extractionUsages: OpenRouterUsage[] = [];
  const startedAt = Date.now();
  const extracted = await withTransientRetry("fact-check extraction", () =>
    consume(
      provider.extractClaimsStream(
        { sentences: inputSentences, lang: "en" },
        { onUsage: (usage) => extractionUsages.push(usage) },
      ),
    ),
  );
  const extractedClaim = extracted.events.find(
    (event): event is (typeof event & { type: "claim"; claim: {
      sentenceIds: string[];
      statement: string;
      type: "numeric" | "date" | "quote" | "causal" | "categorical";
      rationale: string;
    } }) => event.type === "claim",
  )?.claim;
  assert.ok(extractedClaim, "fact-check extraction returned no claim");

  const claim = { ...extractedClaim, id: "smoke-claim-1" };
  claimCacheHashes.add(claimCacheKey(claim.statement, "en"));
  const verifyUsages: OpenRouterUsage[] = [];
  const verificationStartedAt = Date.now();
  const verdict = await withTransientRetry("fact-check verification", () =>
    verifyClaim(claim, {
      lang: "en",
      force: true,
      onUsage: (usage) => verifyUsages.push(usage),
    }),
  );
  assert.equal(verdict.model, "perplexity/sonar-reasoning-pro");
  assert.ok(verdict.sources.length > 0, "Sonar returned no cited sources");

  const id = nanoid(10);
  await prisma.factCheck.create({
    data: {
      id,
      ownerWorkosUserId,
      status: "complete",
      source: "paste",
      sourceRef: "OpenRouter/PostgreSQL smoke test",
      title: "fact-check",
      text,
      language: "en",
      provider: "openai",
      model: extracted.model,
      sentences: JSON.stringify(inputSentences),
      claims: JSON.stringify([claim]),
      verdicts: JSON.stringify([verdict]),
      verifyStatus: "complete",
      verifyModel: verdict.model,
      verifyStartedAt: new Date(startedAt),
      verifyFinishedAt: new Date(),
      finishedAt: new Date(),
    },
  });
  const stored = await prisma.factCheck.findUniqueOrThrow({ where: { id } });
  assert.equal(stored.verifyModel, "perplexity/sonar-reasoning-pro");
  assert.equal(stored.verifyStatus, "complete");

  addResult({
    mode: "fact-check extraction",
    model: extracted.model,
    startedAt,
    usages: extractionUsages,
    detail: `${extracted.events.filter((event) => event.type === "claim").length} claim(s)`,
  });
  addResult({
    mode: "fact-check verification",
    model: verdict.model,
    startedAt: verificationStartedAt,
    usages: verifyUsages,
    detail: `${verdict.verdict}, ${verdict.sources.length} cited source(s)`,
  });
}

async function smokeNeutrality() {
  const text =
    "The reckless opposition once again blocked the government's sensible and unquestionably necessary reform.";
  const inputSentences = [sentence("neutrality-1", text)];
  const usages: OpenRouterUsage[] = [];
  const startedAt = Date.now();
  const output = await withTransientRetry("neutrality", () =>
    consume(
      provider.analyzeNeutralityStream(
        { sentences: inputSentences, lang: "en" },
        { onUsage: (usage) => usages.push(usage) },
      ),
    ),
  );
  const verdict = output.events.find(
    (event): event is typeof event & {
      type: "verdict";
      verdict: string;
      confidence: number;
      rationale: string;
    } => event.type === "verdict",
  );
  assert.ok(verdict, "neutrality returned no verdict");
  const findings = output.events.filter((event) => event.type === "finding");

  const id = nanoid(10);
  await prisma.neutrality.create({
    data: {
      id,
      ownerWorkosUserId,
      status: "complete",
      source: "paste",
      sourceRef: "OpenRouter/PostgreSQL smoke test",
      title: "neutrality",
      text,
      language: "en",
      provider: "openai",
      model: output.model,
      verdict: verdict.verdict,
      confidence: verdict.confidence,
      rationale: verdict.rationale,
      sentences: JSON.stringify(inputSentences),
      findings: JSON.stringify(findings),
      finishedAt: new Date(),
    },
  });
  const stored = await prisma.neutrality.findUniqueOrThrow({ where: { id } });
  assert.equal(stored.verdict, verdict.verdict);

  addResult({
    mode: "neutrality",
    model: output.model,
    startedAt,
    usages,
    detail: `${verdict.verdict}, confidence ${verdict.confidence}`,
  });
}

async function smokeExplain() {
  const text =
    "Random assignment balances observed and unobserved confounders in expectation, allowing differences between treatment groups to be interpreted causally under the study assumptions.";
  const inputSentences = [sentence("paragraph-1", text)];
  const usages: OpenRouterUsage[] = [];
  const startedAt = Date.now();
  const output = await withTransientRetry("explain", () =>
    consume(
      provider.explainStream(
        {
          sections: [
            {
              id: "smoke-section",
              title: "Method",
              level: 1,
              parent: null,
              path: ["Method"],
              blocks: inputSentences,
              chars: text.length,
            },
          ],
          lang: "en",
        },
        {
          level: "high_school",
          onUsage: (usage) => usages.push(usage),
        },
      ),
    ),
  );
  const overview = output.events.find(
    (event): event is typeof event & { type: "overview"; overview: string } =>
      event.type === "overview",
  )?.overview;
  assert.ok(overview, "explain returned no overview");
  const findings = output.events.filter((event) => event.type === "finding");

  const id = nanoid(10);
  await prisma.explanation.create({
    data: {
      id,
      ownerWorkosUserId,
      status: "complete",
      source: "paste",
      sourceRef: "OpenRouter/PostgreSQL smoke test",
      title: "explain",
      text,
      language: "en",
      provider: "openai",
      model: output.model,
      level: "high_school",
      overview,
      blocks: JSON.stringify(inputSentences),
      findings: JSON.stringify(findings),
      finishedAt: new Date(),
    },
  });
  const stored = await prisma.explanation.findUniqueOrThrow({ where: { id } });
  assert.equal(stored.overview, overview);

  addResult({
    mode: "explain",
    model: output.model,
    startedAt,
    usages,
    detail: `${findings.length} paragraph explanation(s)`,
  });
}

async function smokeSlop() {
  const text =
    "In today's rapidly evolving landscape, this groundbreaking game-changer unlocks a transformative paradigm and paves the way for an exciting future.";
  const inputSentences = [sentence("slop-1", text)];
  const usages: OpenRouterUsage[] = [];
  const startedAt = Date.now();
  const output = await withTransientRetry("slop", () =>
    consume(
      provider.analyzeSlopStream(
        { sentences: inputSentences, lang: "en" },
        { onUsage: (usage) => usages.push(usage) },
      ),
    ),
  );
  const findings = output.events.filter((event) => event.type === "finding");
  const score = output.events.find(
    (event): event is typeof event & { type: "score"; score: number } =>
      event.type === "score",
  )?.score;
  const summary = output.events.find(
    (event): event is typeof event & { type: "summary"; summary: string } =>
      event.type === "summary",
  )?.summary;
  assert.ok(findings.length > 0, "slop returned no finding");
  assert.notEqual(score, undefined, "slop returned no score");

  const id = nanoid(10);
  await prisma.slopCheck.create({
    data: {
      id,
      ownerWorkosUserId,
      status: "complete",
      source: "paste",
      sourceRef: "OpenRouter/PostgreSQL smoke test",
      title: "slop",
      text,
      language: "en",
      provider: "openai",
      model: output.model,
      score,
      summary,
      sentences: JSON.stringify(inputSentences),
      findings: JSON.stringify(findings),
      finishedAt: new Date(),
    },
  });
  const stored = await prisma.slopCheck.findUniqueOrThrow({ where: { id } });
  assert.equal(stored.score, score);

  addResult({
    mode: "slop",
    model: output.model,
    startedAt,
    usages,
    detail: `${findings.length} finding(s), score ${score}`,
  });
}

async function smokePaperReview(reviewDepth: "standard" | "deep") {
  const paperText = [
    "SmokeNet: Adaptive Sampling for Reliable Classification",
    "Anonymous Authors",
    "Abstract. We propose an adaptive sampling rule and claim broad improvements in classification reliability.",
    "Method. Twelve participants each labeled twenty examples. The threshold was selected after inspecting the test results.",
    "Results. Accuracy increased from 75% to 84% in one run. We report no confidence intervals, ablations, or external datasets.",
    "Conclusion. SmokeNet therefore improves every classification task and is ready for deployment.",
  ].join("\n\n");
  const venueProfile = resolveVenueProfile({
    venueName: "General smoke-test venue",
    year: "2026",
    track: "Research",
    paperType: "research",
  });
  const id = nanoid(10);
  const reviewDate = "2026-07-31";
  await prisma.paperReview.create({
    data: {
      id,
      ownerWorkosUserId,
      status: "running",
      stage: "ledger",
      source: "pdf",
      sourceRef: `smoke-${reviewDepth}.pdf`,
      title: "SmokeNet",
      venueTarget: venueProfile.targetLabel,
      venueProfile: JSON.stringify(venueProfile),
      reviewDate,
      language: "en",
      provider: "openai",
      model: "gpt-5.6-luna",
      reviewDepth,
      parser: "smoke",
      text: paperText,
      pages: JSON.stringify([{ pageNumber: 1, text: paperText }]),
      complexity: "[]",
    },
  });
  const prepared: PreparedPaperReview = {
    id,
    title: "SmokeNet",
    filename: `smoke-${reviewDepth}.pdf`,
    parser: "smoke",
    pageCount: 1,
    visualPageCount: 0,
    modelId: "gpt-5.6-luna",
    reviewDepth,
    lang: "en",
    venueTarget: venueProfile.targetLabel,
    venueProfile,
    reviewDate,
    pageTaggedPaper: `<<< MANUSCRIPT PAGE 1 >>>\n\n${paperText}`,
    screenshots: [],
  };
  const usages: OpenRouterUsage[] = [];
  const calls: Array<{ operation: string; model: string }> = [];
  const startedAt = Date.now();
  const review = await runPreparedPaperReview(prepared, {
    callbacks: {
      onStage: ({ name }) => console.log(`[${reviewDepth}] stage ${name}`),
      onUsage: (usage) => {
        usages.push(usage);
      },
      onBillableCall: (call) => {
        calls.push(call);
      },
    },
  });
  const stored = await prisma.paperReview.findUniqueOrThrow({ where: { id } });
  assert.equal(stored.status, "complete");
  assert.equal(stored.stage, "complete");
  assert.ok(stored.review, `${reviewDepth} review was not persisted`);

  addResult({
    mode: `paper-review ${reviewDepth}`,
    model: stored.model,
    startedAt,
    usages,
    detail: `${calls.length} call(s), ${review.weaknesses.length} weakness(es); models ${Array.from(new Set(calls.map((call) => call.model))).join(", ")}`,
  });
}

async function assertPostgres() {
  const rows = await prisma.$queryRaw<
    Array<{ database: string; version: string }>
  >`SELECT current_database() AS database, version() AS version`;
  const row = rows[0];
  assert.ok(row?.version.includes("PostgreSQL"), "database is not PostgreSQL");
  console.log(`PostgreSQL: ${row.version.split(",")[0]} (${row.database})`);
}

async function cleanup() {
  await prisma.$transaction([
    prisma.analysis.deleteMany({ where: { ownerWorkosUserId } }),
    prisma.factCheck.deleteMany({ where: { ownerWorkosUserId } }),
    prisma.neutrality.deleteMany({ where: { ownerWorkosUserId } }),
    prisma.explanation.deleteMany({ where: { ownerWorkosUserId } }),
    prisma.slopCheck.deleteMany({ where: { ownerWorkosUserId } }),
    prisma.paperReview.deleteMany({ where: { ownerWorkosUserId } }),
  ]);
  if (claimCacheHashes.size > 0) {
    await prisma.claimVerdict.deleteMany({
      where: { hash: { in: [...claimCacheHashes] } },
    });
  }
}

async function main() {
  assert.ok(process.env.OPENROUTER_API_KEY, "OPENROUTER_API_KEY is required");
  assert.ok(
    process.env.DATABASE_URL?.startsWith("postgresql://"),
    "DATABASE_URL must point to PostgreSQL",
  );
  await assertPostgres();
  const only = process.env.SMOKE_ONLY?.trim();
  if (!only || only === "economical" || only === "fallacy") {
    await smokeFallacy("paste");
  }
  if (!only || only === "economical" || only === "fact-check") {
    await smokeFactCheck();
  }
  if (!only || only === "economical" || only === "neutrality") {
    await smokeNeutrality();
  }
  if (!only || only === "economical" || only === "explain") {
    await smokeExplain();
  }
  if (!only || only === "economical" || only === "slop") {
    await smokeSlop();
  }
  if (!only || only === "economical" || only === "live-analysis") {
    await smokeFallacy("live");
  }
  if (!only || only === "paper-review-standard") {
    await smokePaperReview("standard");
  }
  if (!only || only === "paper-review-deep") {
    await smokePaperReview("deep");
  }

  console.table(
    results.map((result) => ({
      mode: result.mode,
      model: result.model,
      seconds: (result.durationMs / 1_000).toFixed(2),
      costUsd:
        result.providerCostUsd === null
          ? "unreported"
          : result.providerCostUsd.toFixed(6),
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      reasoningTokens: result.reasoningTokens,
      detail: result.detail,
    })),
  );
}

try {
  await main();
} finally {
  await cleanup().catch((error) => {
    console.error("Smoke cleanup failed:", error);
  });
  await prisma.$disconnect();
}
