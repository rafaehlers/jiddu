import assert from "node:assert/strict";
import test from "node:test";
import {
  identityMatchesAllowlist,
  normalizeAccessEmail,
  parseEmailAllowlist,
} from "./access-policy";

test("normalizes and deduplicates access emails", () => {
  assert.deepEqual(
    parseEmailAllowlist(
      " RafaEhlers@gmail.com,other@example.com\nrafaEHLERS@gmail.com ",
    ),
    ["rafaehlers@gmail.com", "other@example.com"],
  );
  assert.equal(normalizeAccessEmail(" USER@Example.COM "), "user@example.com");
});

test("requires a verified exact email match", () => {
  const allowlist = ["rafaehlers@gmail.com"];
  assert.equal(
    identityMatchesAllowlist(
      { email: "RAFAEHLERS@GMAIL.COM", emailVerified: true },
      allowlist,
    ),
    true,
  );
  assert.equal(
    identityMatchesAllowlist(
      { email: "rafaehlers@gmail.com", emailVerified: false },
      allowlist,
    ),
    false,
  );
  assert.equal(
    identityMatchesAllowlist(
      { email: "someone@example.com", emailVerified: true },
      allowlist,
    ),
    false,
  );
});
