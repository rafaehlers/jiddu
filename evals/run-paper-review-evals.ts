/**
 * Paid specialist-stage benchmark.
 *
 * This intentionally exercises the five SPECS prompts directly rather than
 * manufacturing PDFs. It measures whether each specialist detects one
 * injected flaw in 30 short, page-tagged synthetic manuscripts.
 *
 * OPENROUTER_API_KEY=... npm run eval:paper-review
 */
import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import { runSpecsStage } from "../src/lib/llm/paper-review";
import type { PaperLedger } from "../src/lib/paper-review-schema";
import { resolveVenueProfile } from "../src/lib/venues";
import { PAPER_REVIEW_EVAL_CASES } from "./paper-review/fixtures";

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("Set OPENROUTER_API_KEY before running the paid benchmark.");
}

const modelIds = (
  process.env.PAPER_REVIEW_EVAL_MODELS ||
  process.env.PAPER_REVIEW_EVAL_MODEL ||
  "gpt-5.4-mini"
)
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);
const venueProfile = resolveVenueProfile({});
const concurrency = 3;
const requestedLimit = Number.parseInt(
  process.env.PAPER_REVIEW_EVAL_LIMIT || "",
  10,
);
const fixtures =
  Number.isFinite(requestedLimit) && requestedLimit > 0
    ? PAPER_REVIEW_EVAL_CASES.slice(0, requestedLimit)
    : PAPER_REVIEW_EVAL_CASES;
const summaries: Array<{
  requestedModel: string;
  passed: number;
  total: number;
  accuracy: number;
}> = [];

async function main() {
  for (const requestedModel of modelIds) {
  let cursor = 0;
  const rows = new Array<{
    id: string;
    criterion: string;
    title: string;
    pass: boolean;
    requestedModel: string;
    actualModel: string | null;
    matchedTerms: string[];
    findings: unknown[];
    error: string | null;
  }>(fixtures.length);

  const worker = async () => {
    while (cursor < fixtures.length) {
      const index = cursor;
      cursor += 1;
      const fixture = fixtures[index];
      if (!fixture) continue;
      const ledger = buildLedger(fixture.title, fixture.manuscript);
      try {
        const { stage, model } = await runSpecsStage(
          {
            criterion: fixture.criterion,
            paper: fixture.manuscript,
            ledger,
            venueProfile,
            visualPages: [],
          },
          { modelId: requestedModel, lang: "en", strictModel: true },
        );
        const haystack = stage.findings
          .map((finding) => `${finding.title} ${finding.body}`)
          .join(" ")
          .toLowerCase();
        const matchedTerms = fixture.expectedTerms.filter((term) =>
          haystack.includes(term.toLowerCase()),
        );
        const pass = matchedTerms.length > 0;
        rows[index] = {
          id: fixture.id,
          criterion: fixture.criterion,
          title: fixture.title,
          pass,
          requestedModel,
          actualModel: model,
          matchedTerms,
          findings: stage.findings,
          error: null,
        };
        console.log(
          `${pass ? "PASS" : "FAIL"} ${requestedModel} ${fixture.id} ${fixture.title} [actual: ${model}]`,
        );
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        rows[index] = {
          id: fixture.id,
          criterion: fixture.criterion,
          title: fixture.title,
          pass: false,
          requestedModel,
          actualModel: null,
          matchedTerms: [],
          findings: [],
          error,
        };
        console.log(`ERROR ${requestedModel} ${fixture.id}: ${error}`);
      }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));

  const passed = rows.filter((row) => row.pass).length;
  const accuracy = passed / rows.length;
  summaries.push({
    requestedModel,
    passed,
    total: rows.length,
    accuracy,
  });
  writeFileSync(
    new URL(
      `./paper-review/results-${requestedModel.replace(/[^a-z0-9.-]+/gi, "-")}.json`,
      import.meta.url,
    ),
    `${JSON.stringify(rows, null, 2)}\n`,
  );
  console.log(
    `Paper-review specialist benchmark (${requestedModel}): ${passed}/${rows.length} (${(accuracy * 100).toFixed(1)}%)`,
  );
  }

  const summaryUrl = new URL("./paper-review/summary.json", import.meta.url);
  let previous: typeof summaries = [];
  try {
    previous = JSON.parse(readFileSync(summaryUrl, "utf8")) as typeof summaries;
  } catch {
    previous = [];
  }
  const merged = new Map(
    [...previous, ...summaries].map((summary) => [
      summary.requestedModel,
      summary,
    ]),
  );
  writeFileSync(summaryUrl, `${JSON.stringify(Array.from(merged.values()), null, 2)}\n`);
}

function buildLedger(title: string, manuscript: string): PaperLedger {
  return {
    paperTitle: title,
    author: "Synthetic benchmark",
    centralContribution: manuscript,
    constructDefinitions: [],
    claims: [
      {
        id: "C1",
        statement: manuscript,
        kind: "other",
        locations: ["p. 1"],
        evidenceInPaper: manuscript,
        structural: true,
      },
    ],
    unitOfAnalysis: "Synthetic manuscript excerpt",
    systemBoundary: "The supplied excerpt",
    hypotheses: [],
    evaluationDesign: [],
    metricsAndOutcomes: [],
    falsificationConditions: [],
    limitationsAndExclusions: [],
    candidateInternalProblems: [],
  };
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
