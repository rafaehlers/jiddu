/**
 * Paid PDF-to-persisted-review regression check. Supply both original PDFs;
 * keep them and all reports outside the repository. Uses only a disposable
 * loopback PostgreSQL database named jiddu_review_test.
 *
 * DATABASE_URL=postgresql://...@127.0.0.1:55443/jiddu_review_test \
 * node --env-file-if-exists=.env --import tsx scripts/check-paper-review-pdfs.mts \
 *   --trial=/path/to/trial.pdf --non-trial=/path/to/benchmark.pdf --out=/tmp/review-check
 */
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { basename, resolve, relative, isAbsolute } from "node:path";
import { createHash } from "node:crypto";
import type { OpenRouterUsage } from "../src/lib/openrouter-usage";

const args = new Map(process.argv.slice(2).map((arg) => {
  const separator = arg.indexOf("=");
  return [arg.slice(0, separator), arg.slice(separator + 1)];
}));

async function main() {
  const url = new URL(process.env.DATABASE_URL || "");
  assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(url.hostname), "Use a disposable loopback PostgreSQL database, never production.");
  assert.equal(url.pathname, "/jiddu_review_test", "The disposable database must be named jiddu_review_test.");
  assert.ok(process.env.OPENROUTER_API_KEY, "Set OPENROUTER_API_KEY for this paid test.");
  for (const name of ["--trial", "--non-trial", "--out"]) assert.ok(args.get(name), `Missing ${name}`);
  const out = resolve(args.get("--out")!);
  const fromRepo = relative(process.cwd(), out);
  assert.ok(fromRepo.startsWith("..") || isAbsolute(fromRepo), "Keep reports outside the repository.");
  await mkdir(out, { recursive: true });

  // Import database consumers only after the destination has been checked.
  const { prisma } = await import("../src/lib/db");
  const { preparePaperReview, runPreparedPaperReview } = await import("../src/lib/paper-review-job");
  const { resolveVenueProfile } = await import("../src/lib/venues");
  const { PaperReviewResultSchema, PaperLedgerSchema } = await import("../src/lib/paper-review-schema");
  const { SpecsStageResultSchema } = await import("../src/lib/paper-review-audit-schema");
  const { CLINICAL_TRIAL_CHECKS } = await import("../src/lib/clinical-trial-schema");
  const { DEFAULT_ANALYSIS_MODEL_ID } = await import("../src/lib/analysis-models");
  const rows: Array<Record<string, unknown>> = [];
  const startedAt = new Date().toISOString();
  const save = () => writeFile(resolve(out, "summary.json"), JSON.stringify({
    startedAt, model: DEFAULT_ANALYSIS_MODEL_ID, language: "pt", scope: "Complete production review pipeline and persisted output, against a disposable local database with real model and literature-search calls.", rows,
  }, null, 2) + "\n");

  try {
    const cases = [
      { name: "clinical-trial", path: args.get("--trial")!, expectedActive: true },
      { name: "non-trial", path: args.get("--non-trial")!, expectedActive: false },
    ];
    await Promise.allSettled(cases.map(async (input) => {
      const row: Record<string, unknown> = { name: input.name, expectedActive: input.expectedActive, pass: false };
      rows.push(row);
      const usages: OpenRouterUsage[] = [];
      const started = Date.now();
      try {
        const bytes = await readFile(input.path);
        row.pdfSha256 = createHash("sha256").update(bytes).digest("hex");
        const prepared = await preparePaperReview({
          buffer: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
          filename: basename(input.path), lang: "pt", modelId: DEFAULT_ANALYSIS_MODEL_ID,
          reviewDepth: "standard", venueProfile: resolveVenueProfile({}), reviewDate: new Date().toISOString().slice(0, 10),
        });
        row.id = prepared.id;
        row.pages = prepared.pageCount;
        row.parser = prepared.parser;
        const result = await runPreparedPaperReview(prepared, {
          signal: AbortSignal.timeout(40 * 60_000),
          callbacks: {
            onStage: (stage) => { console.log(JSON.stringify({ document: input.name, stage: stage.name, at: new Date().toISOString() })); },
            onStageDone: (stage) => { console.log(JSON.stringify({ document: input.name, stageDone: stage.index, at: new Date().toISOString() })); },
            onUsage: (usage) => { usages.push(usage); },
          },
        });
        const stored = await prisma.paperReview.findUniqueOrThrow({ where: { id: prepared.id } });
        assert.equal(stored.status, "complete");
        assert.equal(stored.stage, "complete");
        const review = PaperReviewResultSchema.parse(JSON.parse(stored.review!));
        assert.deepEqual(review, result);
        PaperLedgerSchema.parse(JSON.parse(stored.ledger!));
        const specs = (JSON.parse(stored.specsReviews!) as unknown[]).map((value) => SpecsStageResultSchema.parse(value));
        assert.equal(specs.length, 5);
        const evaluation = specs.find((item) => item.criterion === "evaluations")!;
        assert.equal(Boolean(evaluation.clinicalTrialCheck), input.expectedActive);
        assert.equal(Boolean(review.clinicalTrial), input.expectedActive);
        assert.deepEqual(JSON.parse(stored.retentionAudit!).missingFindingIds, []);
        assert.ok(stored.markdown?.includes(review.paper));
        assert.ok(stored.finishedAt);
        if (input.expectedActive) {
          assert.equal(review.clinicalTrial!.assessment.studyDesign, "randomized");
          assert.deepEqual(review.clinicalTrial!.assessment.checks.map((item) => item.key), [...CLINICAL_TRIAL_CHECKS]);
          assert.match(stored.markdown!, /Checagem metodológica de ensaio clínico/);
        } else {
          assert.equal(evaluation.clinicalTrialCheck, null);
          assert.ok(!stored.markdown?.includes("### Checagem metodológica de ensaio clínico"));
        }
        await writeFile(resolve(out, input.name + "-review.json"), JSON.stringify(review, null, 2) + "\n");
        await writeFile(resolve(out, input.name + "-review.md"), stored.markdown!);
        await writeFile(resolve(out, input.name + "-audit.json"), JSON.stringify({
          specs, quality: JSON.parse(stored.qualityAudit!), retention: JSON.parse(stored.retentionAudit!), telemetry: JSON.parse(stored.telemetry || "[]"),
        }, null, 2) + "\n");
        row.clinicalCheckActive = Boolean(review.clinicalTrial);
        row.pass = true;
      } catch (error) {
        row.error = error instanceof Error ? error.message : String(error);
      }
      row.durationMs = Date.now() - started;
      row.costUsd = usages.reduce((total, usage) => total + (usage.costUsd ?? 0), 0);
      await save();
      console.log(JSON.stringify(row));
    }));
    await save();
    assert.equal(rows.length, 2);
    assert.ok(rows.every((row) => row.pass), "Both complete reviews must pass before deployment; inspect the external report.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
