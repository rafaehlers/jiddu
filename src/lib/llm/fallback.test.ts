import assert from "node:assert/strict";
import test from "node:test";
import { withModelFallbackPromise } from "./fallback";

test("non-streaming fallback retries and records only the successful model", async () => {
  const attempted: string[] = [];
  const used: string[] = [];
  const result = await withModelFallbackPromise(
    ["first", "second"],
    async (model) => {
      attempted.push(model);
      if (model === "first") throw new Error("temporary failure");
      return `${model}-result`;
    },
    undefined,
    (model) => used.push(model),
  );

  assert.equal(result, "second-result");
  assert.deepEqual(attempted, ["first", "second"]);
  assert.deepEqual(used, ["second"]);
});
