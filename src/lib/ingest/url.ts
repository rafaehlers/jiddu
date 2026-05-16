import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export type IngestedDocument = {
  title: string | null;
  text: string;
  source: string;
  sourceRef: string;
};

export async function ingestUrl(url: string): Promise<IngestedDocument> {
  const parsed = new URL(url);
  if (!/^https?:$/.test(parsed.protocol)) {
    throw new Error("Only http(s) URLs are supported");
  }

  const res = await fetch(parsed.toString(), {
    redirect: "follow",
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; JidduBot/0.1; +https://jiddu.example/bot)",
      accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch URL: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();

  const dom = new JSDOM(html, { url: parsed.toString() });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  const title = article?.title?.trim() || dom.window.document.title || null;
  const text = (article?.textContent || dom.window.document.body?.textContent || "")
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (text.length < 40) {
    throw new Error("Could not extract readable content from the URL");
  }

  return { title, text, source: "url", sourceRef: parsed.toString() };
}
