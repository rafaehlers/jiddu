import assert from "node:assert/strict";
import test from "node:test";
import { paperReviewCallErrorMessage } from "./paper-review-error-message";

test("explains an invalid DeepSeek response and its fallback in plain language", () => {
  assert.equal(
    paperReviewCallErrorMessage({
      error: 'Invalid input: expected string, received object',
      model: "deepseek-v4-flash-0731",
      fallbackModel: "gpt-5.6-luna",
      lang: "pt",
    }),
    "DeepSeek V4 Flash 0731 retornou uma resposta fora do formato esperado. O Jiddu descartou essa tentativa e continuou automaticamente com GPT-5.6 Luna.",
  );
});

test("does not claim that a fallback ran when none is present", () => {
  assert.equal(
    paperReviewCallErrorMessage({
      error: "provider timeout",
      model: "deepseek-v4-flash-0731",
      lang: "en",
    }),
    "DeepSeek V4 Flash 0731 could not complete this attempt. Technical details were recorded for diagnosis.",
  );
});
