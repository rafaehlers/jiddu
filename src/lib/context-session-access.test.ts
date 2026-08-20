import assert from "node:assert/strict";
import test from "node:test";
import {
  canManageContextSession,
  ContextSessionTitleRequestSchema,
} from "./context-session-access";

test("only the authenticated session owner can manage a saved Context session", () => {
  assert.equal(canManageContextSession("user_1", "user_1"), true);
  assert.equal(canManageContextSession(undefined, "user_1"), false);
  assert.equal(canManageContextSession("user_2", "user_1"), false);
  assert.equal(canManageContextSession("user_1", null), false);
});

test("saved Context titles are trimmed and constrained", () => {
  assert.deepEqual(
    ContextSessionTitleRequestSchema.parse({ title: "  Debate  " }),
    { title: "Debate" },
  );
  assert.equal(
    ContextSessionTitleRequestSchema.safeParse({ title: "   " }).success,
    false,
  );
  assert.equal(
    ContextSessionTitleRequestSchema.safeParse({ title: "x".repeat(161) })
      .success,
    false,
  );
});
