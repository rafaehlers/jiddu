import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_STRING_SETTINGS,
  PAPER_REVIEW_MODEL_OPTIONS,
  PERPLEXITY_SEARCH_MODEL_OPTIONS,
  factCheckModelForAttempt,
  isPerplexitySearchModelSetting,
  isAnalysisModelSetting,
  isAnalysisProviderSetting,
} from "./settings";

test("offers Gemma instead of retired DeepSeek for paper review routing", () => {
  assert.equal(PAPER_REVIEW_MODEL_OPTIONS.includes("gemma-4-31b-it"), true);
  assert.equal(
    PAPER_REVIEW_MODEL_OPTIONS.some(
      (model: string) => model === "deepseek-v4-flash-0731",
    ),
    false,
  );
});

test("validates admin-controlled analysis models and their providers", () => {
  assert.equal(isAnalysisModelSetting("glm-5.3-flash"), true);
  assert.equal(isAnalysisModelSetting("claude-opus-5"), true);
  assert.equal(isAnalysisModelSetting("not-a-model"), false);
  assert.equal(isAnalysisProviderSetting("glm-5.3-flash", "price"), true);
  assert.equal(
    isAnalysisProviderSetting("glm-5.3-flash", "novita/fp8"),
    true,
  );
  assert.equal(
    isAnalysisProviderSetting("claude-opus-5", "novita/fp8"),
    false,
  );
});

test("uses the intended fast and deep Perplexity routing defaults", () => {
  assert.equal(
    DEFAULT_STRING_SETTINGS["factcheck.fastModel"],
    "perplexity/sonar",
  );
  assert.equal(
    DEFAULT_STRING_SETTINGS["factcheck.deepModel"],
    "perplexity/sonar",
  );
  assert.equal(
    DEFAULT_STRING_SETTINGS["context.newsModel"],
    "perplexity/sonar",
  );
  assert.equal(
    DEFAULT_STRING_SETTINGS["live.relatedLinksModel"],
    "perplexity/sonar",
  );
});

test("routes first-pass checks to fast and later rechecks to deep", () => {
  const routing = {
    "factcheck.fastModel": "perplexity/sonar" as const,
    "factcheck.deepModel": "perplexity/sonar-reasoning-pro" as const,
  };

  assert.equal(factCheckModelForAttempt(routing, 0), "perplexity/sonar");
  assert.equal(
    factCheckModelForAttempt(routing, 1),
    "perplexity/sonar-reasoning-pro",
  );
});

test("only accepts supported Perplexity search models", () => {
  for (const model of PERPLEXITY_SEARCH_MODEL_OPTIONS) {
    assert.equal(isPerplexitySearchModelSetting(model), true);
  }
  assert.equal(isPerplexitySearchModelSetting("perplexity/sonar-pro"), false);
  assert.equal(isPerplexitySearchModelSetting("openai/gpt-5"), false);
});
