import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAppLanguage } from "@/lib/language";

test("normalizes supported browser locales to Jiddu language codes", () => {
  assert.equal(normalizeAppLanguage("pt-BR"), "pt");
  assert.equal(normalizeAppLanguage("pt_PT"), "pt");
  assert.equal(normalizeAppLanguage("es-AR"), "es");
  assert.equal(normalizeAppLanguage("en-US"), "en");
});

test("normalizes human-readable language names returned by models", () => {
  assert.equal(normalizeAppLanguage("Portuguese (Brazilian)"), "pt");
  assert.equal(normalizeAppLanguage("Português"), "pt");
  assert.equal(normalizeAppLanguage("Spanish"), "es");
  assert.equal(normalizeAppLanguage("English"), "en");
});

test("uses an explicit fallback for missing or unsupported languages", () => {
  assert.equal(normalizeAppLanguage(null), "en");
  assert.equal(normalizeAppLanguage("French", "pt"), "pt");
});
