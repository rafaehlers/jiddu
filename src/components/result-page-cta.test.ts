import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const RESULT_PAGES = [
  "src/app/a/[id]/page.tsx",
  "src/app/f/[id]/page.tsx",
  "src/app/n/[id]/page.tsx",
  "src/app/e/[id]/page.tsx",
  "src/app/s/[id]/page.tsx",
  "src/app/r/[id]/page.tsx",
  "src/app/live/[id]/page.tsx",
  "src/app/live/[id]/transcript/page.tsx",
] as const;

const PRINT_PAGES = [
  "src/app/a/[id]/print/page.tsx",
  "src/app/f/[id]/print/page.tsx",
  "src/app/n/[id]/print/page.tsx",
  "src/app/e/[id]/print/page.tsx",
  "src/app/s/[id]/print/page.tsx",
  "src/app/r/[id]/print/page.tsx",
  "src/app/live/[id]/print/page.tsx",
] as const;

test("adds the new-analysis CTA to every finished result viewer", async () => {
  for (const path of RESULT_PAGES) {
    const source = await readFile(path, "utf8");
    assert.match(source, /<ResultPageCta\b/, path);
  }
});

test("keeps the result CTA out of every print viewer", async () => {
  for (const path of PRINT_PAGES) {
    const source = await readFile(path, "utf8");
    assert.doesNotMatch(source, /ResultPageCta/, path);
  }
});
