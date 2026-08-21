import assert from "node:assert/strict";
import test from "node:test";
import { isVisualOwnerIdentity } from "./visual-access";

test("allows only Rafael's verified account to open the visual atlas", () => {
  assert.equal(
    isVisualOwnerIdentity({
      email: "RAFAEHLERS@GMAIL.COM",
      emailVerified: true,
    }),
    true,
  );
  assert.equal(
    isVisualOwnerIdentity({
      email: "rafaehlers@gmail.com",
      emailVerified: false,
    }),
    false,
  );
  assert.equal(
    isVisualOwnerIdentity({
      email: "someone@example.com",
      emailVerified: true,
    }),
    false,
  );
  assert.equal(isVisualOwnerIdentity(null), false);
});
