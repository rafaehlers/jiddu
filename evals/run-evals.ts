/**
 * Eval runner for the Jiddu public API.
 *
 * Loads the fixed test sets in evals/<tool>/{inputs,expected}.json, calls the
 * deployed REST API for each input, compares against the expected result,
 * writes evals/<tool>/results.json, and regenerates evals/report.md.
 *
 * Usage:
 *   JIDDU_API_KEY=<key> npx tsx evals/run-evals.ts
 *   JIDDU_API_URL=http://localhost:3000 JIDDU_API_KEY=<key> npx tsx evals/run-evals.ts
 *   ... npx tsx evals/run-evals.ts fallacies neutrality   # subset
 *
 * The fact-check set calls Perplexity Sonar (paid, ~$0.005/claim) — running
 * the whole suite costs a few cents and takes a couple of minutes.
 */

import { readFileSync, writeFileSync } from "node:fs";

const BASE = (process.env.JIDDU_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
const KEY = process.env.JIDDU_API_KEY ?? "";
const CONCURRENCY = 3;

if (!KEY) {
  console.error("Set JIDDU_API_KEY (an active key from /admin/api-keys).");
  process.exit(1);
}

type Tool = "fallacies" | "fact-check" | "neutrality" | "explain";
const ENDPOINT: Record<Tool, string> = {
  fallacies: "detect-fallacies",
  "fact-check": "fact-check",
  neutrality: "assess-neutrality",
  explain: "explain",
};

const ALL_TOOLS: Tool[] = ["fallacies", "fact-check", "neutrality", "explain"];
const selected = process.argv.slice(2).filter((a): a is Tool =>
  (ALL_TOOLS as string[]).includes(a),
);
const tools = selected.length > 0 ? selected : ALL_TOOLS;

type Input = { id: string; text: string; lang?: string; level?: string };

function load<T>(tool: Tool, file: string): T {
  return JSON.parse(
    readFileSync(new URL(`./${tool}/${file}`, import.meta.url), "utf8"),
  ) as T;
}

async function callApi(tool: Tool, input: Input): Promise<unknown> {
  const body: Record<string, unknown> = { text: input.text };
  if (input.lang) body.lang = input.lang;
  if (input.level) body.level = input.level;
  const res = await fetch(`${BASE}/api/v1/${ENDPOINT[tool]}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-jiddu-key": KEY },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(290_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${detail.slice(0, 200)}`);
  }
  return res.json();
}

// Run items through a tool with bounded concurrency.
async function runTool(
  tool: Tool,
  grade: (input: Input, expected: any, response: any) => { pass: boolean; detail: string },
): Promise<{ pass: number; total: number; rows: any[] }> {
  const inputs = load<Input[]>(tool, "inputs.json");
  const expected = load<Record<string, any>>(tool, "expected.json");
  const rows: any[] = new Array(inputs.length);

  let cursor = 0;
  let pass = 0;
  const worker = async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= inputs.length) return;
      const input = inputs[idx];
      const exp = expected[input.id];
      try {
        const response = await callApi(tool, input);
        const g = grade(input, exp, response);
        if (g.pass) pass++;
        rows[idx] = { id: input.id, pass: g.pass, detail: g.detail, expected: exp, response };
        console.log(`  [${tool}] ${input.id}: ${g.pass ? "PASS" : "FAIL"} — ${g.detail}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        rows[idx] = { id: input.id, pass: false, detail: `error: ${message}`, expected: exp, response: null };
        console.log(`  [${tool}] ${input.id}: ERROR — ${message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  writeFileSync(
    new URL(`./${tool}/results.json`, import.meta.url),
    JSON.stringify(rows, null, 2) + "\n",
  );
  return { pass, total: inputs.length, rows };
}

// ---------- graders ----------

function gradeFallacies(_i: Input, exp: any, res: any) {
  const verdictOk = res?.verdict === exp.verdict;
  const names: string[] = (res?.fallacies ?? []).map((f: any) => String(f.name).toLowerCase());
  const wanted: string[] = exp.fallacies ?? [];
  const found = wanted.filter((w) => names.some((n) => n.includes(w.toLowerCase())));
  const recallOk = wanted.length === 0 ? true : found.length === wanted.length;
  const pass = verdictOk && recallOk;
  return {
    pass,
    detail: `verdict ${res?.verdict} (want ${exp.verdict}); matched ${found.length}/${wanted.length} [${wanted.join(", ") || "—"}]`,
  };
}

function gradeNeutrality(_i: Input, exp: any, res: any) {
  const labelOk = res?.label === exp.label;
  const biased = res?.label === "biased" || res?.label === "highly_biased";
  const directionOk = biased === exp.biased;
  return {
    pass: labelOk,
    detail: `label ${res?.label} (want ${exp.label}); direction ${directionOk ? "ok" : "wrong"}; score ${res?.score}`,
  };
}

function gradeFactCheck(_i: Input, exp: any, res: any) {
  const pass = res?.overall_verdict === exp.overall_verdict;
  return {
    pass,
    detail: `overall ${res?.overall_verdict} (want ${exp.overall_verdict}); ${res?.claims?.length ?? 0} claims`,
  };
}

function gradeExplain(_i: Input, exp: any, res: any) {
  const roles: string[] = (res?.paragraphs ?? []).map((p: any) => String(p.role));
  const wanted: string[] = exp.roles ?? [];
  const pass = roles.some((r) => wanted.includes(r));
  return { pass, detail: `roles [${roles.join(", ")}] (want one of [${wanted.join(", ")}])` };
}

const GRADERS: Record<Tool, (i: Input, e: any, r: any) => { pass: boolean; detail: string }> = {
  fallacies: gradeFallacies,
  "fact-check": gradeFactCheck,
  neutrality: gradeNeutrality,
  explain: gradeExplain,
};

const TOOL_TITLE: Record<Tool, string> = {
  fallacies: "Fallacy detection",
  "fact-check": "Fact-check",
  neutrality: "Neutrality",
  explain: "Explain (role tagging)",
};

// ---------- main ----------

async function main() {
  console.log(`Running evals against ${BASE} for: ${tools.join(", ")}\n`);
  const summary: { tool: Tool; pass: number; total: number; rows: any[] }[] = [];
  for (const tool of tools) {
    console.log(`# ${tool}`);
    const r = await runTool(tool, GRADERS[tool]);
    summary.push({ tool, ...r });
    console.log("");
  }

  // Build report.md
  const stamp = process.env.EVAL_STAMP ?? "(run locally — set EVAL_STAMP to record a date)";
  const lines: string[] = [];
  lines.push("# Jiddu API — eval report");
  lines.push("");
  lines.push(
    "Fixed test sets run against the public REST API. Each tool has 15–16 inputs with expected results in `evals/<tool>/expected.json`. Regenerate with `JIDDU_API_KEY=<key> npx tsx evals/run-evals.ts`.",
  );
  lines.push("");
  lines.push(`Last run: ${stamp}`);
  lines.push("");
  lines.push("## Accuracy by tool");
  lines.push("");
  lines.push("| Tool | Passed | Total | Accuracy |");
  lines.push("| --- | --- | --- | --- |");
  for (const s of summary) {
    const pct = s.total ? ((s.pass / s.total) * 100).toFixed(1) : "0.0";
    lines.push(`| ${TOOL_TITLE[s.tool]} | ${s.pass} | ${s.total} | ${pct}% |`);
  }
  lines.push("");
  lines.push("### What each grader checks");
  lines.push("");
  lines.push("- **Fallacy detection** — the `verdict` matches (fallacies_found / clean) and every expected fallacy name appears in the response.");
  lines.push("- **Fact-check** — `overall_verdict` matches (reliable / unreliable). Claims are verified live via Perplexity Sonar.");
  lines.push("- **Neutrality** — the `label` matches exactly (neutral / mostly_neutral / biased / highly_biased).");
  lines.push("- **Explain** — at least one returned paragraph carries the expected section `role`.");
  lines.push("");
  for (const s of summary) {
    lines.push(`## ${TOOL_TITLE[s.tool]} — per item`);
    lines.push("");
    lines.push("| ID | Result | Detail |");
    lines.push("| --- | --- | --- |");
    for (const row of s.rows) {
      lines.push(`| ${row.id} | ${row.pass ? "✅" : "❌"} | ${String(row.detail).replace(/\|/g, "\\|")} |`);
    }
    lines.push("");
  }

  writeFileSync(new URL("./report.md", import.meta.url), lines.join("\n"));

  console.log("Summary:");
  for (const s of summary) {
    const pct = s.total ? ((s.pass / s.total) * 100).toFixed(1) : "0.0";
    console.log(`  ${TOOL_TITLE[s.tool]}: ${s.pass}/${s.total} (${pct}%)`);
  }
  console.log("\nWrote evals/report.md and evals/<tool>/results.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
