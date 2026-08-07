import assert from "node:assert/strict";
import test from "node:test";
import {
  extractContextNews,
  MAX_CONTEXT_NEWS_LINKS,
} from "./context-news-results";

test("keeps at most two unique safe sources for related coverage", () => {
  const results = extractContextNews(
    [
      {
        url_citation: {
          url: "https://news.example/story#section",
          title: "First report",
        },
      },
      {
        url_citation: {
          url: "https://news.example/story",
          title: "Duplicate report",
        },
      },
      {
        url_citation: {
          url: "https://official.example/update",
          title: "Official update",
        },
      },
      {
        url_citation: {
          url: "https://third.example/extra",
          title: "Third result",
        },
      },
    ],
    "Neutral related context, not a verification.",
  );

  assert.equal(results.length, MAX_CONTEXT_NEWS_LINKS);
  assert.deepEqual(
    results.map((result) => result.url),
    ["https://news.example/story", "https://official.example/update"],
  );
  assert.equal(results[0].summary, "Neutral related context, not a verification.");
});

test("rejects malformed and non-http coverage URLs", () => {
  assert.deepEqual(
    extractContextNews(
      [
        { url_citation: { url: "javascript:alert(1)", title: "Unsafe" } },
        { url_citation: { url: "not a url", title: "Malformed" } },
      ],
      null,
    ),
    [],
  );
});
