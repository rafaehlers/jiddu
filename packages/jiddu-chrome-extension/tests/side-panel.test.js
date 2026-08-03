import assert from "node:assert/strict";
import test from "node:test";

import {
  defaultSidePanelOptions,
  tabSidePanelOptions,
} from "../lib/side-panel.js";

test("the default side panel is disabled outside analyzed tabs", () => {
  assert.deepEqual(defaultSidePanelOptions(), {
    path: "sidepanel.html",
    enabled: false,
  });
});

test("an analyzed tab gets its own side panel instance", () => {
  assert.deepEqual(tabSidePanelOptions(42), {
    tabId: 42,
    path: "sidepanel.html",
    enabled: true,
  });
});

test("tab side panel options reject invalid tab IDs", () => {
  assert.throws(() => tabSidePanelOptions(null));
  assert.throws(() => tabSidePanelOptions(0));
  assert.throws(() => tabSidePanelOptions(2.5));
});
