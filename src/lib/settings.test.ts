import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_STRING_SETTINGS,
  PERPLEXITY_SEARCH_MODEL_OPTIONS,
  factCheckModelForAttempt,
  isPerplexitySearchModelSetting,
} from "./settings";

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
