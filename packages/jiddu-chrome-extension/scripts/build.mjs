import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  productionManifest,
  productionRuntimeConfig,
  productionSidepanelHtml,
} from "../lib/production.js";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.join(packageRoot, "dist");
const unpackedRoot = path.join(distRoot, "jiddu-chrome-extension");
const packageJson = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));
const sourceManifest = JSON.parse(await readFile(path.join(packageRoot, "manifest.json"), "utf8"));
const zipPath = path.join(distRoot, `jiddu-critical-reading-${packageJson.version}.zip`);

assertBuildPath(unpackedRoot);
assertBuildPath(zipPath);
await rm(unpackedRoot, { recursive: true, force: true });
await rm(zipPath, { force: true });
await mkdir(unpackedRoot, { recursive: true });

for (const file of [
  "content-script.js",
  "content-style.css",
  "service-worker.js",
  "sidepanel.css",
  "sidepanel.js",
  "welcome.css",
  "welcome.html",
  "welcome.js",
]) {
  await cp(path.join(packageRoot, file), path.join(unpackedRoot, file));
}
for (const directory of ["_locales", "icons"]) {
  await cp(path.join(packageRoot, directory), path.join(unpackedRoot, directory), {
    recursive: true,
  });
}
await mkdir(path.join(unpackedRoot, "lib"), { recursive: true });
for (const file of [
  "api.js",
  "i18n.js",
  "onboarding-i18n.js",
  "print.js",
  "runtime-config.js",
  "side-panel.js",
]) {
  await cp(path.join(packageRoot, "lib", file), path.join(unpackedRoot, "lib", file));
}

await writeFile(
  path.join(unpackedRoot, "manifest.json"),
  `${JSON.stringify(productionManifest(sourceManifest, packageJson.version), null, 2)}\n`,
);
await writeFile(
  path.join(unpackedRoot, "sidepanel.html"),
  productionSidepanelHtml(await readFile(path.join(packageRoot, "sidepanel.html"), "utf8")),
);
await writeFile(
  path.join(unpackedRoot, "lib", "runtime-config.js"),
  productionRuntimeConfig(),
);

execFileSync("zip", ["-qr", zipPath, "."], { cwd: unpackedRoot });

console.log(`Production extension: ${unpackedRoot}`);
console.log(`Chrome Web Store ZIP: ${zipPath}`);

function assertBuildPath(target) {
  const relative = path.relative(packageRoot, target);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to modify an unsafe build path: ${target}`);
  }
}
