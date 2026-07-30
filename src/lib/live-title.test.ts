import assert from "node:assert/strict";
import test from "node:test";
import {
  briefTopic,
  buildLiveAnalysisTitle,
  resolveAnalysisTitle,
} from "./live-title";

test("builds a local timestamp and concise topic from a live summary", () => {
  const summary =
    "The passage makes a modest causal claim about the economic effects of deporting foreign workers and then shifts to a policy conclusion about Europe’s need for migrants.";

  assert.equal(
    buildLiveAnalysisTitle({
      createdAt: new Date("2026-07-30T21:58:19.761Z"),
      summary,
      timeZone: "America/Sao_Paulo",
    }),
    "2026-07-30 18:58 — The economic effects of deporting foreign workers",
  );
});

test("extracts a brief Portuguese topic without generic summary wording", () => {
  assert.equal(
    briefTopic(
      "O trecho apresenta uma discussão sobre os efeitos da imigração na economia europeia e depois muda para política pública.",
    ),
    "Os efeitos da imigração na economia europeia",
  );
});

test("keeps an existing title and only generates fallbacks for live analyses", () => {
  const base = {
    createdAt: new Date("2026-07-30T21:48:00.000Z"),
    summary: "Migration and the European economy.",
    transcript: "",
    language: "en",
  };

  assert.equal(
    resolveAnalysisTitle({ ...base, source: "live", title: "Stored title" }),
    "Stored title",
  );
  assert.equal(
    resolveAnalysisTitle({ ...base, source: "paste", title: null }),
    null,
  );
});

test("uses a localized session label when no topic is available", () => {
  assert.equal(
    buildLiveAnalysisTitle({
      createdAt: new Date("2026-07-30T21:48:00.000Z"),
      language: "pt",
      timeZone: "America/Sao_Paulo",
    }),
    "2026-07-30 18:48 — Sessão ao vivo",
  );
});
