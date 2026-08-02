import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_API_TEXT_CHARS,
  MIN_API_TEXT_CHARS,
  mergeChunkResults,
  normalizeApiBase,
  splitIntoApiChunks,
} from "../lib/api.js";
import {
  DEFAULT_UI_LANG,
  formatUiMessage,
  getInspectorMessages,
  getUiMessages,
  normalizeUiLang,
} from "../lib/i18n.js";

test("keeps a short selection in one API request", () => {
  const text = "Este é um argumento suficientemente longo para ser analisado pelo Jiddu.";
  assert.deepEqual(splitIntoApiChunks(text), [text]);
});

test("splits long selections into valid API-sized chunks", () => {
  const sentence = "Este parágrafo contém uma afirmação completa para preservar o contexto da análise. ";
  const chunks = splitIntoApiChunks(sentence.repeat(90));

  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.length <= MAX_API_TEXT_CHARS));
  assert.ok(chunks.every((chunk) => chunk.length >= MIN_API_TEXT_CHARS));
  assert.equal(
    chunks.join(" ").replace(/\s+/g, " ").trim(),
    sentence.repeat(90).replace(/\s+/g, " ").trim(),
  );
});

test("merges and deduplicates fallacy results", () => {
  const repeated = { name: "Ad hominem", excerpt: "Você é ignorante", explanation: "Ataca a pessoa." };
  const result = mergeChunkResults("fallacies", [
    { charCount: 100, result: { fallacies: [repeated], fallacy_count: 1, verdict: "fallacies_found" } },
    { charCount: 100, result: { fallacies: [repeated], fallacy_count: 1, verdict: "fallacies_found" } },
  ]);

  assert.equal(result.fallacy_count, 1);
  assert.equal(result.verdict, "fallacies_found");
});

test("uses the strongest document verdict when merging fact checks", () => {
  const result = mergeChunkResults("facts", [
    { charCount: 100, result: { claims: [], overall_verdict: "reliable" } },
    {
      charCount: 100,
      result: {
        claims: [{ claim: "A", verdict: "false", explanation: "Não.", confidence: "high" }],
        overall_verdict: "unreliable",
      },
    },
  ]);

  assert.equal(result.overall_verdict, "unreliable");
  assert.equal(result.claims.length, 1);
});

test("weights neutrality scores by chunk length", () => {
  const result = mergeChunkResults("neutrality", [
    { charCount: 100, result: { score: 1, signals: [], summary: "Neutro." } },
    { charCount: 300, result: { score: 0, signals: [], summary: "Parcial." } },
  ]);

  assert.equal(result.score, 0.25);
  assert.equal(result.label, "biased");
});

test("accepts only the API hosts declared by the extension", () => {
  assert.equal(normalizeApiBase("http://localhost:3000/"), "http://localhost:3000");
  assert.equal(normalizeApiBase("https://example.com"), "https://jiddu.app");
});

test("uses English as the default interface language", () => {
  assert.equal(DEFAULT_UI_LANG, "en");
  assert.equal(normalizeUiLang(undefined), "en");
  assert.equal(normalizeUiLang("unknown"), "en");
  assert.equal(getUiMessages(undefined)["empty.select"], "Select a passage");
});

test("keeps interface and explanation languages independent", () => {
  assert.equal(getUiMessages("pt")["settings.explanationLanguage"], "Idioma das explicações");
  assert.equal(getUiMessages("es")["lens.facts"], "Hechos");
});

test("ships the same interface keys in every supported language", () => {
  const englishKeys = Object.keys(getUiMessages("en")).sort();
  assert.deepEqual(Object.keys(getUiMessages("pt")).sort(), englishKeys);
  assert.deepEqual(Object.keys(getUiMessages("es")).sort(), englishKeys);
});

test("formats translated variables and exposes only inspector copy to pages", () => {
  const english = getUiMessages("en");
  assert.equal(
    formatUiMessage(english, "loading.progressMulti", { current: 2, total: 3 }),
    "Analyzing part 2 of 3",
  );
  const inspector = getInspectorMessages("pt");
  assert.equal(inspector["lens.fallacies"], "Falácias");
  assert.equal(inspector["settings.apiKey"], undefined);
});
