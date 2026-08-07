import "server-only";

import type { Lang } from "./fallacies";

export type WikipediaProfile = {
  canonicalName: string;
  description: string;
  imageUrl: string | null;
  wikipediaUrl: string;
  wikidataId: string | null;
  language: Lang;
};

type WikipediaPage = {
  title?: string;
  extract?: string;
  fullurl?: string;
  thumbnail?: { source?: string };
  pageprops?: { wikibase_item?: string };
};

type WikipediaResponse = {
  query?: { pages?: WikipediaPage[] };
};

const FETCH_TIMEOUT_MS = 8_000;

export async function findWikipediaProfile(
  name: string,
  language: Lang,
): Promise<WikipediaProfile | null> {
  const preferred = await searchWikipedia(name, language);
  if (preferred) return preferred;
  if (language === "en") return null;
  return searchWikipedia(name, "en");
}

async function searchWikipedia(
  name: string,
  language: Lang,
): Promise<WikipediaProfile | null> {
  const url = new URL(`https://${language}.wikipedia.org/w/api.php`);
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    titles: name.slice(0, 180),
    redirects: "1",
    prop: "extracts|pageimages|pageprops|info",
    exintro: "1",
    explaintext: "1",
    piprop: "thumbnail",
    pithumbsize: "480",
    inprop: "url",
  }).toString();

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "Jiddu/1.0 (https://jiddu.app; context enrichment)",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Wikipedia returned ${response.status}`);
  }

  const payload = (await response.json()) as WikipediaResponse;
  const page = payload.query?.pages?.find(
    (candidate) =>
      candidate.title?.trim() &&
      candidate.extract?.trim() &&
      candidate.fullurl?.trim(),
  );
  if (!page?.title || !page.extract || !page.fullurl) return null;

  return {
    canonicalName: page.title.trim().slice(0, 240),
    description: compactExtract(page.extract),
    imageUrl: safeHttpUrl(page.thumbnail?.source),
    wikipediaUrl: safeHttpUrl(page.fullurl) ?? page.fullurl,
    wikidataId: normalizeWikidataId(page.pageprops?.wikibase_item),
    language,
  };
}

function compactExtract(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  const sentences = normalized.match(/[^.!?]+[.!?]+/g)?.slice(0, 3).join(" ");
  return (sentences?.trim() || normalized).slice(0, 1_200);
}

function safeHttpUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function normalizeWikidataId(value: string | undefined): string | null {
  const normalized = value?.trim().toUpperCase() ?? "";
  return /^Q\d+$/.test(normalized) ? normalized : null;
}
