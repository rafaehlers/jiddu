import assert from "node:assert/strict";
import test from "node:test";
import { emailBrandHeader } from "./email-brand-header";

test("renders an email-safe linked Jiddu brand header", () => {
  const html = emailBrandHeader();

  assert.match(html, /role="presentation"/);
  assert.match(html, /href="https:\/\/jiddu\.app"/);
  assert.match(
    html,
    /src="https:\/\/jiddu\.app\/brand\/jiddu_logo_email\.png"/,
  );
  assert.match(html, /width="64" height="64" alt="Jiddu"/);
  assert.match(html, />JIDDU<\/span>/);
  assert.match(html, />Critical reading<\/span>/);
  assert.doesNotMatch(html, /display:flex|display:grid/);
});
