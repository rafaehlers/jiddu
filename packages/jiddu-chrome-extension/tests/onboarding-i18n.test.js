import assert from "node:assert/strict";
import test from "node:test";

import {
  ONBOARDING_MESSAGES,
  getOnboardingMessages,
} from "../lib/onboarding-i18n.js";

test("onboarding ships the same keys in every supported language", () => {
  const englishKeys = Object.keys(ONBOARDING_MESSAGES.en).sort();
  assert.deepEqual(Object.keys(ONBOARDING_MESSAGES.pt).sort(), englishKeys);
  assert.deepEqual(Object.keys(ONBOARDING_MESSAGES.es).sort(), englishKeys);
});

test("onboarding defaults to English", () => {
  assert.equal(getOnboardingMessages("unknown"), ONBOARDING_MESSAGES.en);
});
