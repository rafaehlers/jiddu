import assert from "node:assert/strict";
import test from "node:test";
import { buildClaimsUserPrompt } from "./claims-prompt";
import { buildNeutralityUserPrompt } from "./neutrality-prompt";
import { buildUserPrompt } from "./prompt";
import type { EditorialMetadata } from "./ingest/url";
import type { Sentence } from "./schema";

const sentences: Sentence[] = [
  {
    id: "s0",
    start: 0,
    end: 29,
    text: "A quoted political statement.",
    editorialKind: "quote",
    containsQuotation: true,
    section: "Politics",
    quoteAttribution: "The minister",
  },
];

const metadata: EditorialMetadata = {
  title: "Diplomatic relations",
  siteName: "Example News",
  author: "Reporter & Editor",
  publishedAt: "2026-08-05T17:46:23-03:00",
  canonicalUrl: "https://example.com/report?a=1&b=2",
  contentType: "NewsArticle",
};

test("annotates editorial structure without changing the analyzable sentence", () => {
  const prompt = buildUserPrompt(sentences, "pt", undefined, metadata);

  assert.match(
    prompt,
    /\[s0\]\[kind=quote;contains_quotation=true;section="Politics";attributed_to="The minister"\] A quoted political statement\./,
  );
  assert.match(prompt, /<publisher>Example News<\/publisher>/);
  assert.match(prompt, /Reporter &amp; Editor/);
  assert.match(prompt, /a=1&amp;b=2/);
  assert.match(prompt, /metadata.*not evidence/i);
});

test("teaches claims and neutrality to distinguish speakers from narration", () => {
  const claims = buildClaimsUserPrompt(
    sentences,
    "pt",
    undefined,
    undefined,
    metadata,
  );
  const neutrality = buildNeutralityUserPrompt(
    sentences,
    "pt",
    undefined,
    metadata,
  );

  assert.match(claims, /Attribute a statement to a speaker only when/);
  assert.match(
    neutrality,
    /do not present a quoted speaker's wording as the journalist's own wording/,
  );
});
