import assert from "node:assert/strict";
import test from "node:test";
import { buildReportEmailHtml } from "./report-email-html";

test("extracts the printable report and makes links email-safe", () => {
  const html = buildReportEmailHtml({
    cta: "Open report",
    intro: "Requested <report>",
    lang: "en",
    printHtml: `<!doctype html><html><body>
      <main class="print-root">
        <style>.print-root { color: #111; }</style>
        <h1>Stored &amp; escaped title</h1>
        <a href="/legal">Terms</a>
        <section>
          <h2>Tags</h2>
          <ul class="live-print-chips">
            <li>Politics</li>
            <li>International relations</li>
          </ul>
        </section>
        <button>Do not email this</button>
        <script>dangerous()</script>
      </main>
      <script>nextPayload()</script>
    </body></html>`,
    reportUrl: "https://jiddu.app/a/report-1",
    title: "Title <unsafe>",
  });

  assert.match(html, /Stored &amp; escaped title/);
  assert.match(html, /href="https:\/\/jiddu\.app\/legal"/);
  assert.match(html, /Requested &lt;report&gt;/);
  assert.match(html, /<title>Title &lt;unsafe&gt;<\/title>/);
  assert.match(html, /jiddu_logo_email\.png/);
  assert.match(html, />Critical reading<\/span>/);
  assert.match(html, /<ul class="email-tag-list"/);
  assert.match(html, /list-style:disc outside/);
  assert.match(html, /<li style="display:list-item;/);
  assert.doesNotMatch(html, /class="live-print-chips"/);
  assert.doesNotMatch(html, /Do not email this|dangerous|nextPayload/);
});

test("rejects a page without a printable report", () => {
  assert.throws(
    () =>
      buildReportEmailHtml({
        cta: "Open",
        intro: "Intro",
        lang: "en",
        printHtml: "<html><body>Not a report</body></html>",
        reportUrl: "https://jiddu.app/a/report-1",
        title: "Report",
      }),
    /did not contain a report body/,
  );
});
