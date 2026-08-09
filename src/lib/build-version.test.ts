import assert from "node:assert/strict";
import test from "node:test";
import { normalizeBuildVersion } from "./build-version";

test("accepts and trims the deployed version mask", () => {
  assert.equal(
    normalizeBuildVersion(" 2026-08-08 23:42 fa66078 "),
    "2026-08-08 23:42 fa66078",
  );
});

test("rejects missing or malformed build versions", () => {
  const malformedVersions = [
    undefined,
    "",
    "20260808 23:42 fa66078",
    "2026-08-08 24:42 fa66078",
    "2026-08-08 23:60 fa66078",
    "2026-08-08 23:42 fa6607",
    "2026-08-08 23:42 FA66078",
  ];

  for (const version of malformedVersions) {
    assert.equal(normalizeBuildVersion(version), null, String(version));
  }
});
