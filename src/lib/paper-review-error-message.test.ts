import assert from "node:assert/strict";
import test from "node:test";
import { paperReviewCallErrorMessage } from "./paper-review-error-message";

test("explains an invalid Gemma response and its fallback in plain language", () => {
  assert.equal(
    paperReviewCallErrorMessage({
      error: 'Invalid input: expected string, received object',
      model: "gemma-4-31b-it",
      fallbackModel: "gpt-5.6-luna",
      lang: "pt",
    }),
    "Gemma 4 31B retornou uma resposta fora do formato esperado. O Jiddu descartou essa tentativa e continuou automaticamente com GPT-5.6 Luna.",
  );
});

test("does not claim that a fallback ran when none is present", () => {
  assert.equal(
    paperReviewCallErrorMessage({
      error: "provider timeout",
      model: "gemma-4-31b-it",
      lang: "en",
    }),
    "Gemma 4 31B could not complete this attempt. Technical details were recorded for diagnosis.",
  );
});
