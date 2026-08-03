import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPrintViewUrl,
  parsePrintTabId,
} from "../lib/print.js";

test("buildPrintViewUrl keeps the extension URL and adds the source tab", () => {
  assert.equal(
    buildPrintViewUrl("chrome-extension://jiddu/sidepanel.html", 42),
    "chrome-extension://jiddu/sidepanel.html?printTabId=42",
  );
});

test("buildPrintViewUrl replaces an existing print tab parameter", () => {
  assert.equal(
    buildPrintViewUrl("chrome-extension://jiddu/sidepanel.html?printTabId=7", 91),
    "chrome-extension://jiddu/sidepanel.html?printTabId=91",
  );
});

test("buildPrintViewUrl rejects an invalid source tab", () => {
  assert.throws(() => buildPrintViewUrl("chrome-extension://jiddu/sidepanel.html", null));
  assert.throws(() => buildPrintViewUrl("chrome-extension://jiddu/sidepanel.html", -1));
});

test("parsePrintTabId accepts only positive integer tab IDs", () => {
  assert.equal(parsePrintTabId("?printTabId=42"), 42);
  assert.equal(parsePrintTabId("?printTabId=0"), null);
  assert.equal(parsePrintTabId("?printTabId=4.2"), null);
  assert.equal(parsePrintTabId("?printTabId=hello"), null);
  assert.equal(parsePrintTabId(""), null);
});
