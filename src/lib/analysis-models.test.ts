import assert from "node:assert/strict";
import test from "node:test";
import {
  providerRoutingPayload,
  resolveAnalysisModel,
} from "./analysis-models";

test("routes GLM through the cheapest compatible endpoint with high reasoning", () => {
  const model = resolveAnalysisModel("glm-5.3-flash");
  assert.equal(model.reasoningEffort, "high");
  assert.deepEqual(providerRoutingPayload(model.id, "price"), {
    allow_fallbacks: true,
    require_parameters: true,
    sort: "price",
  });
});

test("prefers a named provider while retaining endpoint failover", () => {
  assert.deepEqual(providerRoutingPayload("glm-5.3-flash", "novita/fp8"), {
    allow_fallbacks: true,
    require_parameters: true,
    order: ["novita/fp8"],
  });
});

test("ignores a provider that does not serve the selected model", () => {
  assert.deepEqual(providerRoutingPayload("claude-opus-5", "novita/fp8"), {
    allow_fallbacks: true,
    require_parameters: true,
  });
});
