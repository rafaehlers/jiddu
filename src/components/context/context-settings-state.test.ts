import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_CONTEXT_SETTINGS,
  readContextSettings,
} from "./context-settings-state";

test("uses three displayed fact sources by default", () => {
  assert.equal(readContextSettings(null).factSourceLimit, 3);
});

test("keeps supported context preferences and repairs invalid values", () => {
  const settings = readContextSettings(
    JSON.stringify({
      factSourceLimit: 5,
      expandFactSources: true,
      showMiniMap: false,
      animateRelations: "yes",
      showActivityLog: false,
      automaticNews: false,
      analysisIntervalMs: 12_345,
    }),
  );
  assert.deepEqual(settings, {
    factSourceLimit: 5,
    expandFactSources: true,
    showMiniMap: false,
    animateRelations: DEFAULT_CONTEXT_SETTINGS.animateRelations,
    showActivityLog: false,
    automaticNews: false,
    analysisIntervalMs: DEFAULT_CONTEXT_SETTINGS.analysisIntervalMs,
  });
});
