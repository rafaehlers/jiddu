import assert from "node:assert/strict";
import test from "node:test";
import { validateReviewSource } from "./paper-review-source-validation";

test("rejects private source URLs without fetching them", async () => {
  const result = await validateReviewSource({
    url: "http://127.0.0.1/private",
    title: "Private source",
  });
  assert.equal(result.verificationStatus, "unreachable");
  assert.match(result.verificationNote ?? "", /verification failed/i);
});
