import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_MODEL_CHAIN } from "./fallback";
import {
  cleanImageTranscription,
  MODEL_CATALOG,
  resolveModel,
  resolvePaperReviewModel,
} from "./openrouter";

test("normalizes a fenced image transcription without changing its text", () => {
  assert.equal(
    cleanImageTranscription("```text\nSpeaker: Exact words.\nSecond line.\n```"),
    "Speaker: Exact words.\nSecond line.",
  );
  assert.equal(cleanImageTranscription("  Exact words.  "), "Exact words.");
});

test("uses GPT-5.6 Luna first and DeepSeek V4 Flash as the fallback", () => {
  assert.equal(MODEL_CATALOG[0]?.id, "gpt-5.6-luna");
  assert.equal(resolveModel().openrouter, "openai/gpt-5.6-luna");
  assert.equal(resolveModel().reasoningEffort, "high");
  assert.equal(resolveModel().supportsVision, true);
  assert.equal(
    resolveModel("deepseek-v4-flash-0731").openrouter,
    "deepseek/deepseek-v4-flash-0731",
  );
  assert.equal(resolveModel("deepseek-v4-flash-0731").reasoningEffort, "low");
  assert.equal(resolveModel("deepseek-v4-flash-0731").supportsVision, false);
  assert.deepEqual(DEFAULT_MODEL_CHAIN, [
    "gpt-5.6-luna",
    "deepseek-v4-flash-0731",
  ]);
});

test("uses Luna Pro at xhigh reasoning for Deep review", () => {
  const model = resolvePaperReviewModel("gpt-5.6-luna-pro");

  assert.equal(model.openrouter, "openai/gpt-5.6-luna-pro");
  assert.equal(model.reasoningEffort, "xhigh");
});

test("keeps retired models internal to historical paper-review evals", () => {
  assert.equal(resolveModel("gpt-5.4-mini").id, "gpt-5.6-luna");
  assert.equal(
    resolvePaperReviewModel("gpt-5.4-mini").openrouter,
    "openai/gpt-5.4-mini",
  );
});
