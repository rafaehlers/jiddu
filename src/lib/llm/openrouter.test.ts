import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_MODEL_CHAIN } from "./fallback";
import {
  MODEL_CATALOG,
  resolveModel,
  resolvePaperReviewModel,
} from "./openrouter";

test("uses GPT-5.6 Luna as the public default with high reasoning", () => {
  assert.equal(MODEL_CATALOG[0]?.id, "gpt-5.6-luna");
  assert.equal(resolveModel().openrouter, "openai/gpt-5.6-luna");
  assert.equal(resolveModel().reasoningEffort, "high");
  assert.deepEqual(DEFAULT_MODEL_CHAIN, ["gpt-5.6-luna", "minimax-m3"]);
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
