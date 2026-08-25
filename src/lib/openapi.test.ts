import assert from "node:assert/strict";
import test from "node:test";
import { JIDDU_OPENAPI } from "./openapi";

const EXPECTED_OPERATIONS = [
  ["/api/v1/detect-fallacies", "post"],
  ["/api/v1/fact-check", "post"],
  ["/api/v1/assess-neutrality", "post"],
  ["/api/v1/explain", "post"],
  ["/api/v1/detect-slop", "post"],
  ["/api/v1/adversarial-reviews", "post"],
  ["/api/v1/adversarial-reviews/{id}", "get"],
] as const;

test("publishes every public REST operation with unique identifiers", () => {
  assert.equal(JIDDU_OPENAPI.openapi, "3.1.0");
  assert.deepEqual(
    Object.keys(JIDDU_OPENAPI.paths).sort(),
    [...new Set(EXPECTED_OPERATIONS.map(([path]) => path))].sort(),
  );

  const operationIds = EXPECTED_OPERATIONS.map(([path, method]) => {
    const pathItem = JIDDU_OPENAPI.paths[path];
    assert.ok(method in pathItem, `${method.toUpperCase()} ${path} is missing`);
    const operation = (
      pathItem as unknown as Record<
        string,
        {
          description: string;
          operationId: string;
          responses: Record<string, unknown>;
          security: Array<{ JidduApiKey: never[] }>;
        }
      >
    )[method];
    assert.ok(operation.description.length >= 60);
    assert.deepEqual(operation.security, [{ JidduApiKey: [] }]);
    assert.ok("responses" in operation);
    return operation.operationId;
  });

  assert.equal(new Set(operationIds).size, EXPECTED_OPERATIONS.length);
});

test("describes the production API-key authentication contract", () => {
  assert.deepEqual(JIDDU_OPENAPI.servers, [
    { url: "https://jiddu.app", description: "Production" },
  ]);
  assert.deepEqual(JIDDU_OPENAPI.components.securitySchemes.JidduApiKey, {
    type: "apiKey",
    in: "header",
    name: "X-Jiddu-Key",
    description:
      "Account-owned API key created at https://jiddu.app/account?tab=api. The key is shown once, stored only as a SHA-256 hash, and can be revoked by its owner.",
  });
});

test("resolves every local OpenAPI reference", () => {
  const document: unknown = JIDDU_OPENAPI;

  function visit(value: unknown, location: string): void {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => visit(entry, `${location}/${index}`));
      return;
    }
    if (!value || typeof value !== "object") return;

    for (const [key, entry] of Object.entries(value)) {
      if (key === "$ref" && typeof entry === "string") {
        assert.ok(entry.startsWith("#/"), `${location} has an external ref`);
        const resolved = entry
          .slice(2)
          .split("/")
          .map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"))
          .reduce<unknown>((current, segment) => {
            assert.ok(
              current && typeof current === "object" && segment in current,
              `${entry} referenced at ${location} does not resolve`,
            );
            return (current as Record<string, unknown>)[segment];
          }, document);
        assert.notEqual(resolved, undefined);
      }
      visit(entry, `${location}/${key}`);
    }
  }

  visit(document, "#");
});
