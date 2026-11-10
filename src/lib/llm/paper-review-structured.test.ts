import assert from "node:assert/strict";
import test from "node:test";
import { buildPaperLedger } from "./paper-review";
import type { PaperReviewModelCallEvent } from "./paper-review";
import type { OpenRouterUsage } from "../openrouter-usage";

const manuscript = "<<< MANUSCRIPT PAGE 1 >>>\nA synthetic experiment compares two conditions with ten observations in each.";
const validLedger = () => ({
  paperTitle: "Synthetic experiment", author: "Example Research Group",
  centralContribution: "A comparison of two conditions.",
  constructDefinitions: [],
  claims: [{ id: "C1", statement: "Each condition has ten observations.", kind: "quantitative", locations: ["p. 1"], evidenceInPaper: "ten observations in each", structural: true }],
  unitOfAnalysis: "Observation", systemBoundary: "The supplied experiment",
  hypotheses: [], evaluationDesign: [], metricsAndOutcomes: [],
  falsificationConditions: [], limitationsAndExclusions: [], candidateInternalProblems: [],
});

async function withReplies(
  replies: Array<unknown | { httpError: number }>,
  run: (requests: Array<Record<string, unknown>>) => Promise<void>,
) {
  const originalFetch = globalThis.fetch;
  const requests: Array<Record<string, unknown>> = [];
  globalThis.fetch = async (input, init) => {
    requests.push(JSON.parse(await new Request(input, init).text()));
    assert.ok(requests.length <= replies.length, "Unexpected extra provider call");
    const value = replies[requests.length - 1];
    if (value && typeof value === "object" && "httpError" in value) {
      return Response.json({ error: { message: "Synthetic provider failure" } }, { status: Number(value.httpError) });
    }
    return Response.json({
      id: `test-${requests.length}`, object: "chat.completion", created: 0,
      model: "synthetic-provider", choices: [{ index: 0, finish_reason: "tool_calls", message: {
        role: "assistant", content: null,
        tool_calls: [{ id: `call-${requests.length}`, type: "function", function: { name: "report_analysis", arguments: JSON.stringify(value) } }],
      } }],
      usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20, cost: 0.001 },
    });
  };
  try { await run(requests); } finally { globalThis.fetch = originalFetch; }
}

test("repairs invalid ledger output using explicit validation feedback and original evidence", async () => {
  const invalid = validLedger();
  invalid.claims[0].locations = [];
  invalid.claims[0].kind = "clinical";
  const usages: OpenRouterUsage[] = [];
  const events: PaperReviewModelCallEvent[] = [];
  await withReplies([invalid, validLedger()], async (requests) => {
    const result = await buildPaperLedger(manuscript, [], {
      modelId: "gpt-5.6-luna", lang: "en", strictModel: true, apiKey: "synthetic-test-only",
      onUsage: (usage) => { usages.push(usage); },
      onCallEvent: (event) => { events.push(event); },
    });
    assert.equal(requests.length, 2);
    assert.deepEqual(result.ledger.claims[0].locations, ["p. 1"]);
    assert.equal(result.ledger.claims[0].kind, "quantitative");
    const tools = requests[0].tools as Array<{ function: { strict: boolean } }>;
    assert.equal(tools[0].function.strict, true);
    const messages = requests[1].messages as Array<{ role: string; content?: unknown }>;
    assert.deepEqual(messages.slice(0, 2), requests[0].messages);
    const feedback = messages.find((item) => item.role === "tool")!.content as string;
    assert.match(feedback, /claims\.0\.locations/);
    assert.match(feedback, /claims\.0\.kind/);
    assert.match(feedback, /never invent locations/);
  });
  assert.deepEqual(usages.map((usage) => usage.completed), [false, true]);
  assert.deepEqual(events.map((event) => event.kind), ["started", "failed", "started", "completed"]);
});

test("allows only one validation repair across the entire fallback chain", async () => {
  const invalid = validLedger();
  invalid.claims[0].locations = [];
  await withReplies([invalid, invalid, invalid], async (requests) => {
    await assert.rejects(buildPaperLedger(manuscript, [], {
      modelId: "gpt-5.6-luna", fallbackModels: ["gemma-4-31b-it"],
      lang: "en", apiKey: "synthetic-test-only",
    }), /Structured review stage failed/);
    assert.equal(requests.length, 3);
    assert.equal(requests[0].model, requests[1].model);
    assert.notEqual(requests[1].model, requests[2].model);
  });
});

test("provider errors fall back without issuing a schema-repair call", async () => {
  await withReplies([{ httpError: 400 }, validLedger()], async (requests) => {
    const result = await buildPaperLedger(manuscript, [], {
      modelId: "gpt-5.6-luna", fallbackModels: ["gemma-4-31b-it"],
      lang: "en", apiKey: "synthetic-test-only",
    });
    assert.equal(result.model, "gemma-4-31b-it");
    assert.equal(requests.length, 2);
    assert.equal((requests[1].messages as unknown[]).length, 2);
  });
});

test("an aborted operation does not issue a validation-repair request", async () => {
  const controller = new AbortController();
  const invalid = validLedger();
  invalid.claims[0].locations = [];
  await withReplies([invalid], async (requests) => {
    await assert.rejects(buildPaperLedger(manuscript, [], {
      modelId: "gpt-5.6-luna", lang: "en", apiKey: "synthetic-test-only",
      signal: controller.signal, onUsage: () => { controller.abort(); },
    }));
    assert.equal(requests.length, 1);
  });
});
