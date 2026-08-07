import assert from "node:assert/strict";
import test from "node:test";
import { resolveLiveNeutrality } from "./live-neutrality";

const current = {
  verdict: "explicitly_partisan",
  confidence: 0.82,
  rationale: "A strongly framed passage was found.",
  textType: "analysis",
};

test("keeps the strongest neutrality signal during a running session", () => {
  const result = resolveLiveNeutrality(
    current,
    {
      verdict: "neutral",
      confidence: 0.95,
      rationale: "The latest passage is neutral.",
      textType: "informational",
    },
    false,
  );

  assert.equal(result.verdict, "explicitly_partisan");
  assert.equal(result.confidence, 0.82);
  assert.equal(result.rationale, current.rationale);
});

test("lets the holistic final assessment replace the running aggregate", () => {
  const result = resolveLiveNeutrality(
    current,
    {
      verdict: "neutral",
      confidence: 0.91,
      rationale: "The complete conversation presents no sustained slant.",
      textType: "informational",
    },
    true,
  );

  assert.equal(result.verdict, "neutral");
  assert.equal(result.confidence, 0.91);
  assert.equal(
    result.rationale,
    "The complete conversation presents no sustained slant.",
  );
});
