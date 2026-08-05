import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedReportEmailOrigin } from "./report-email-origin";

test("allows the canonical public origin used in production", () => {
  assert.equal(
    isAllowedReportEmailOrigin("https://jiddu.app", "https://jiddu.app"),
    true,
  );
  assert.equal(
    isAllowedReportEmailOrigin("https://jiddu.app/", "https://jiddu.app"),
    true,
  );
});

test("allows requests without an Origin header", () => {
  assert.equal(isAllowedReportEmailOrigin(null, "https://jiddu.app"), true);
});

test("rejects malformed and external origins", () => {
  assert.equal(
    isAllowedReportEmailOrigin("not-a-url", "https://jiddu.app"),
    false,
  );
  assert.equal(
    isAllowedReportEmailOrigin("https://example.com", "https://jiddu.app"),
    false,
  );
});
