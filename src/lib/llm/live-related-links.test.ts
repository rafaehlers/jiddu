import assert from "node:assert/strict";
import test from "node:test";
import { extractRelatedLinks, MAX_RELATED_LINKS } from "./live-related-links";

test("normalizes, deduplicates and caps Sonar related links", () => {
  const annotations = Array.from({ length: 14 }, (_, index) => ({
    type: "url_citation",
    url_citation: {
      url:
        index === 1
          ? "https://example.com/article#duplicate"
          : index === 0
            ? "https://example.com/article"
            : `https://source${index}.example/story`,
      title: `Source ${index}`,
    },
  }));

  const links = extractRelatedLinks(annotations);
  assert.equal(links.length, MAX_RELATED_LINKS);
  assert.equal(links[0].url, "https://example.com/article");
  assert.equal(links[0].source, "example.com");
  assert.equal(
    links.filter((link) => link.url === "https://example.com/article").length,
    1,
  );
});

test("rejects unsafe and malformed citation URLs", () => {
  const links = extractRelatedLinks([
    { url_citation: { url: "javascript:alert(1)", title: "Unsafe" } },
    { url_citation: { url: "not a URL", title: "Malformed" } },
    {
      url_citation: {
        url: "https://pt.wikipedia.org/wiki/Conselho_Nacional_de_Justiça",
        title: "Conselho Nacional de Justiça",
      },
    },
  ]);

  assert.deepEqual(links, [
    {
      title: "Conselho Nacional de Justiça",
      url: "https://pt.wikipedia.org/wiki/Conselho_Nacional_de_Justi%C3%A7a",
      source: "pt.wikipedia.org",
    },
  ]);
});
