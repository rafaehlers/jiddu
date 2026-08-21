import assert from "node:assert/strict";
import test from "node:test";
import {
  sanitizeSlopFindings,
  SlopFindingSchema,
  type SlopFinding,
} from "./slop-schema";

const quoteWithArtifacts =
  'We may now be entering a third era. [s20][block="b12";kind=paragraph;section="A speculative essay"] Software built for agents.';
const cleanQuote =
  "We may now be entering a third era. Software built for agents.";

test("sanitizes prompt artifacts in new slop findings", () => {
  const parsed = SlopFindingSchema.parse({
    sentenceIds: ["s19", "s20"],
    pattern: "dramatic_fragmentation",
    severity: "low",
    quote: quoteWithArtifacts,
    explanation: "The fragment manufactures a reveal.",
  });

  assert.equal(parsed.quote, cleanQuote);
});

test("sanitizes prompt artifacts in previously stored slop findings", () => {
  const stored = {
    sentenceIds: ["s19", "s20"],
    pattern: "dramatic_fragmentation",
    severity: "low",
    quote: quoteWithArtifacts,
    explanation: "The fragment manufactures a reveal.",
  } as SlopFinding;

  assert.equal(sanitizeSlopFindings([stored])[0].quote, cleanQuote);
});
