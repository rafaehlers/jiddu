import assert from "node:assert/strict";
import test from "node:test";
import { summarizePaperReviewTelemetry } from "./paper-review-telemetry";

test("summarizes stage duration and fallback model attempts", () => {
  const timeline = summarizePaperReviewTelemetry(
    JSON.stringify([
      {
        kind: "stage_started",
        stageIndex: 1,
        stage: "research",
        at: "2026-08-02T05:40:00.000Z",
      },
      {
        kind: "call_started",
        callId: "first",
        stageIndex: 1,
        stage: "research",
        operation: "research",
        model: "gpt-5.5",
        startedAt: "2026-08-02T05:40:01.000Z",
      },
      {
        kind: "call_failed",
        callId: "first",
        stageIndex: 1,
        stage: "research",
        operation: "research",
        model: "gpt-5.5",
        startedAt: "2026-08-02T05:40:01.000Z",
        finishedAt: "2026-08-02T05:40:31.000Z",
        durationMs: 30_000,
        error: "provider timeout",
      },
      {
        kind: "call_started",
        callId: "fallback",
        stageIndex: 1,
        stage: "research",
        operation: "research",
        model: "gpt-5.6-luna",
        startedAt: "2026-08-02T05:40:31.100Z",
      },
      {
        kind: "call_completed",
        callId: "fallback",
        stageIndex: 1,
        stage: "research",
        operation: "research",
        model: "gpt-5.6-luna",
        startedAt: "2026-08-02T05:40:31.100Z",
        finishedAt: "2026-08-02T05:41:01.100Z",
        durationMs: 30_000,
      },
      {
        kind: "stage_completed",
        stageIndex: 1,
        stage: "research",
        startedAt: "2026-08-02T05:40:00.000Z",
        finishedAt: "2026-08-02T05:41:02.000Z",
        durationMs: 62_000,
      },
    ]),
  );

  assert.equal(timeline.length, 1);
  assert.equal(timeline[0].status, "complete");
  assert.equal(timeline[0].durationMs, 62_000);
  assert.deepEqual(
    timeline[0].calls.map((call) => [call.model, call.status, call.durationMs]),
    [
      ["gpt-5.5", "failed", 30_000],
      ["gpt-5.6-luna", "complete", 30_000],
    ],
  );
  assert.equal(timeline[0].calls[0].error, "provider timeout");
});

test("keeps an unfinished stage and call visible as running", () => {
  const timeline = summarizePaperReviewTelemetry(
    JSON.stringify([
      {
        kind: "stage_started",
        stageIndex: 0,
        stage: "ledger",
        at: "2026-08-02T05:39:00.000Z",
      },
      {
        kind: "call_started",
        callId: "ledger-call",
        stageIndex: 0,
        stage: "ledger",
        operation: "ledger",
        model: "gpt-5.6-luna",
        startedAt: "2026-08-02T05:39:01.000Z",
      },
    ]),
  );

  assert.equal(timeline[0].status, "running");
  assert.equal(timeline[0].durationMs, null);
  assert.equal(timeline[0].calls[0].status, "running");
});

test("ignores malformed telemetry", () => {
  assert.deepEqual(summarizePaperReviewTelemetry("not json"), []);
  assert.deepEqual(
    summarizePaperReviewTelemetry(JSON.stringify([{ kind: "unknown" }])),
    [],
  );
});
