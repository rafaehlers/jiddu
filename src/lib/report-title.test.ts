import assert from "node:assert/strict";
import test from "node:test";
import {
  canManageReportTitle,
} from "./report-title";
import {
  ReportTitleKindSchema,
  ReportTitleRequestSchema,
} from "./report-title-schema";

test("accepts every editable report kind", () => {
  for (const kind of ["a", "f", "n", "e", "s", "r", "live"]) {
    assert.equal(ReportTitleKindSchema.parse(kind), kind);
  }
  assert.equal(ReportTitleKindSchema.safeParse("context").success, false);
});

test("normalizes and validates report titles", () => {
  assert.deepEqual(ReportTitleRequestSchema.parse({ title: "  Debate  " }), {
    title: "Debate",
  });
  assert.equal(
    ReportTitleRequestSchema.safeParse({ title: "   " }).success,
    false,
  );
  assert.equal(
    ReportTitleRequestSchema.safeParse({ title: "x".repeat(161) }).success,
    false,
  );
});

test("allows title management only for the signed-in owner", () => {
  assert.equal(canManageReportTitle("user-1", "user-1"), true);
  assert.equal(canManageReportTitle("user-1", "user-2"), false);
  assert.equal(canManageReportTitle(null, "user-1"), false);
  assert.equal(canManageReportTitle("user-1", null), false);
});
