import assert from "node:assert/strict";
import test from "node:test";
import { claimCacheKey } from "./factcheck/cache";
import { buildVerifyUserPrompt } from "./verify-claim-prompt";

test("uses the captured source as disambiguation context, not automatic proof", () => {
  const sourceUrl =
    "https://www.bloomberg.com/news/videos/2026-08-05/ai-frenzy";
  const prompt = buildVerifyUserPrompt(
    "Emily Zhao works at Salesforce Ventures.",
    "categorical",
    sourceUrl,
  );

  assert.match(prompt, /bloomberg\.com/);
  assert.match(prompt, /not proof/i);
  assert.match(prompt, /disambiguate/i);
});

test("scopes cached verdicts to the captured source URL", () => {
  const statement = "A named participant holds a specific role.";
  const first = claimCacheKey(statement, "en", "https://example.com/a");
  const second = claimCacheKey(statement, "en", "https://example.com/b");
  const repeated = claimCacheKey(statement, "en", "https://example.com/a");

  assert.notEqual(first, second);
  assert.equal(first, repeated);
});

test("scopes cached verdicts to the verification model", () => {
  const statement = "A named participant holds a specific role.";
  const fast = claimCacheKey(
    statement,
    "en",
    null,
    "perplexity/sonar",
  );
  const deep = claimCacheKey(
    statement,
    "en",
    null,
    "perplexity/sonar-reasoning-pro",
  );

  assert.notEqual(fast, deep);
});
