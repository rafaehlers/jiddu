import assert from "node:assert/strict";
import test from "node:test";

import {
  productionManifest,
  productionRuntimeConfig,
  productionSidepanelHtml,
} from "../lib/production.js";

test("production manifest keeps only the Jiddu HTTPS host", () => {
  const manifest = productionManifest({
    manifest_version: 3,
    host_permissions: ["http://localhost:3000/*"],
  }, "0.1.0");
  assert.deepEqual(manifest.host_permissions, ["https://jiddu.app/*"]);
  assert.equal(manifest.version, "0.1.0");
});

test("production side panel removes development-only server choices", () => {
  const html = '<select><option value="https://jiddu.app">Jiddu</option>\n<option data-development-only value="http://localhost:3000">Local</option></select>';
  const output = productionSidepanelHtml(html);
  assert.match(output, /https:\/\/jiddu\.app/);
  assert.doesNotMatch(output, /localhost|development-only/);
});

test("production runtime accepts only the HTTPS API origin", () => {
  const output = productionRuntimeConfig();
  assert.match(output, /https:\/\/jiddu\.app/);
  assert.doesNotMatch(output, /localhost|127\.0\.0\.1/);
});

test("production manifest rejects invalid inputs", () => {
  assert.throws(() => productionManifest({}, "0.1.0"));
  assert.throws(() => productionManifest({ manifest_version: 3 }, "beta"));
});
