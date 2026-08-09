import assert from "node:assert/strict";
import test from "node:test";
import { venueSuggestionSchema } from "./venue-suggestion";

test("normalizes a valid venue suggestion", () => {
  const result = venueSuggestionSchema.parse({
    lang: "pt",
    name: "  Annals of Internal Medicine  ",
    url: "  https://www.acpjournals.org/journal/aim  ",
  });

  assert.deepEqual(result, {
    lang: "pt",
    name: "Annals of Internal Medicine",
    url: "https://www.acpjournals.org/journal/aim",
  });
});

test("accepts an omitted official URL", () => {
  const result = venueSuggestionSchema.parse({
    lang: "en",
    name: "Medical Journal",
    url: "",
  });

  assert.equal(result.url, undefined);
});

test("rejects unsafe or credential-bearing URLs", () => {
  for (const url of [
    "javascript:alert(1)",
    "ftp://example.com/journal",
    "https://user:password@example.com/journal",
  ]) {
    assert.equal(
      venueSuggestionSchema.safeParse({ lang: "es", name: "Journal", url })
        .success,
      false,
    );
  }
});

test("rejects incomplete venue suggestions", () => {
  assert.equal(
    venueSuggestionSchema.safeParse({ lang: "en", name: "A", url: "" })
      .success,
    false,
  );
});
