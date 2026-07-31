import assert from "node:assert/strict";
import test from "node:test";
import { APP_TIME_ZONE, formatAppDateTime } from "./date-time";

test("formats server timestamps in Brasília time", () => {
  const timestamp = new Date("2026-07-31T00:07:35.000Z");

  assert.equal(APP_TIME_ZONE, "America/Sao_Paulo");
  assert.equal(
    formatAppDateTime(timestamp, "en-US"),
    "7/30/2026, 9:07:35 PM",
  );
  assert.equal(
    formatAppDateTime(timestamp, "pt-BR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    "30/07/2026, 21:07",
  );
});
