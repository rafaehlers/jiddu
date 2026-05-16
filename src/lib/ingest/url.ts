import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { IngestError } from "./errors";

export type IngestedDocument = {
  title: string | null;
  text: string;
  source: string;
  sourceRef: string;
};

const FETCH_TIMEOUT_MS = 15_000;

export async function ingestUrl(url: string): Promise<IngestedDocument> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new IngestError("invalid_url", "Invalid URL");
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    throw new IngestError("invalid_url", "Only http(s) URLs are supported");
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(parsed.toString(), {
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; JidduBot/0.1; +https://jiddu.app/bot)",
        accept: "text/html,application/xhtml+xml,*/*;q=0.8",
        "accept-language": "en;q=0.9,*;q=0.5",
      },
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") {
      throw new IngestError("timeout", "The site took too long to respond");
    }
    throw new IngestError(
      "unreachable",
      `Could not reach the URL: ${(err as Error)?.message ?? "network error"}`,
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new IngestError(
        "blocked",
        `The site refused our request (${res.status})`,
        res.status,
      );
    }
    if (res.status === 404) {
      throw new IngestError("not_found", "The page returned 404", 404);
    }
    if (res.status === 429) {
      throw new IngestError("rate_limited", "The site rate-limited us", 429);
    }
    throw new IngestError(
      "fetch_failed",
      `Could not fetch the URL (${res.status} ${res.statusText})`,
      res.status,
    );
  }

  const html = await res.text();
  const dom = new JSDOM(html, { url: parsed.toString() });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  const title = article?.title?.trim() || dom.window.document.title || null;
  const text = (article?.textContent || dom.window.document.body?.textContent || "")
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (text.length < 40) {
    throw new IngestError(
      "extraction_failed",
      "Could not extract readable content from the page",
    );
  }

  return { title, text, source: "url", sourceRef: parsed.toString() };
}
