import assert from "node:assert/strict";
import test from "node:test";
import { claimCacheKey } from "./factcheck/cache";
import {
  buildVerificationTarget,
  buildVerifySystemPrompt,
  buildVerifyUserPrompt,
} from "./verify-claim-prompt";

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

test("checks the proposition instead of confirming a Context speaker's speech act", () => {
  const statement =
    "Flávio Bolsonaro afirmou que pessoas da classe média que acreditaram no PT não conseguem pagar as prestações de carros.";
  const target = buildVerificationTarget(
    statement,
    "categorical",
    "Flávio Bolsonaro",
  );
  const prompt = buildVerifyUserPrompt(
    statement,
    "categorical",
    "https://example.com/discurso",
    "Flávio Bolsonaro",
  );

  assert.equal(
    target,
    "pessoas da classe média que acreditaram no PT não conseguem pagar as prestações de carros.",
  );
  assert.match(prompt, /underlying proposition to verify/i);
  assert.match(
    prompt,
    /merely confirms that Flávio Bolsonaro said it is insufficient/i,
  );
  assert.match(prompt, new RegExp(escapeRegExp(target)));
});

test("keeps attribution as the target for quote claims", () => {
  const statement = 'Lula disse: "O orçamento aumentará em 2027".';
  const target = buildVerificationTarget(statement, "quote", "Lula");
  const prompt = buildVerifyUserPrompt(
    statement,
    "quote",
    null,
    "Lula",
  );

  assert.equal(target, statement);
  assert.match(prompt, /quote\/attribution claim/i);
  assert.match(prompt, /whether the named source actually used/i);
});

test("handles according-to attribution in Portuguese, English, and Spanish", () => {
  assert.equal(
    buildVerificationTarget(
      "Segundo Ana, a inflação caiu em 2025.",
      "categorical",
      "Ana",
    ),
    "a inflação caiu em 2025.",
  );
  assert.equal(
    buildVerificationTarget(
      "According to Ana, inflation fell in 2025.",
      "categorical",
      "Ana",
    ),
    "inflation fell in 2025.",
  );
  assert.equal(
    buildVerificationTarget(
      "Según Ana, la inflación cayó en 2025.",
      "categorical",
      "Ana",
    ),
    "la inflación cayó en 2025.",
  );
});

test("system prompt rejects speech-only evidence for non-quote claims", () => {
  const prompt = buildVerifySystemPrompt("pt");

  assert.match(prompt, /verify P — not whether Person uttered/i);
  assert.match(prompt, /does not support P/i);
  assert.match(prompt, /For quote claims/i);
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
