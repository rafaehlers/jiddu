import "server-only";

import type { Lang } from "./fallacies";
import {
  buildContextualWikipediaQuery,
  isPublicProfileCompatible,
  scorePublicProfileMatch,
  type EntityProfileHint,
} from "./context-profile-match";

export type WikipediaProfile = {
  canonicalName: string;
  description: string;
  imageUrl: string | null;
  wikipediaUrl: string;
  wikidataId: string | null;
  language: Lang;
};

type WikipediaPage = {
  index?: number;
  title?: string;
  extract?: string;
  fullurl?: string;
  thumbnail?: { source?: string };
  pageprops?: { wikibase_item?: string };
};

type CompleteWikipediaPage = WikipediaPage & {
  title: string;
  extract: string;
  fullurl: string;
};

type WikipediaResponse = {
  query?: { pages?: WikipediaPage[] };
};

type WikidataEntity = {
  claims?: {
    P31?: Array<{
      mainsnak?: { datavalue?: { value?: { id?: string } } };
    }>;
  };
};

type WikidataResponse = {
  entities?: Record<string, WikidataEntity>;
};

const FETCH_TIMEOUT_MS = 8_000;

export async function findWikipediaProfile(
  entity: EntityProfileHint,
  language: Lang,
): Promise<WikipediaProfile | null> {
  const preferred = await searchWikipedia(entity, language);
  if (preferred) return preferred;
  if (language === "en") return null;
  return searchWikipedia(entity, "en");
}

async function searchWikipedia(
  entity: EntityProfileHint,
  language: Lang,
): Promise<WikipediaProfile | null> {
  const contextualPages = await fetchWikipediaPages(language, {
    generator: "search",
    gsrsearch: buildContextualWikipediaQuery(entity, language),
    gsrnamespace: "0",
    gsrlimit: "6",
  });
  const contextualPage = await selectCompatiblePage(contextualPages, entity);
  if (contextualPage) return toWikipediaProfile(contextualPage, language);

  const exactPages = await fetchWikipediaPages(language, {
    titles: entity.name.slice(0, 180),
    redirects: "1",
  });
  const exactPage = await selectCompatiblePage(exactPages, entity);
  return exactPage ? toWikipediaProfile(exactPage, language) : null;
}

async function fetchWikipediaPages(
  language: Lang,
  query: Record<string, string>,
): Promise<CompleteWikipediaPage[]> {
  const url = new URL(`https://${language}.wikipedia.org/w/api.php`);
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    prop: "extracts|pageimages|pageprops|info",
    exintro: "1",
    explaintext: "1",
    piprop: "thumbnail",
    pithumbsize: "480",
    inprop: "url",
    ...query,
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
  return (payload.query?.pages ?? [])
    .filter(isCompleteWikipediaPage)
    .sort((left, right) => (left.index ?? 999) - (right.index ?? 999));
}

async function selectCompatiblePage(
  pages: CompleteWikipediaPage[],
  entity: EntityProfileHint,
): Promise<CompleteWikipediaPage | null> {
  const compatible = pages
    .filter((page) =>
      isPublicProfileCompatible(entity, {
        canonicalName: page.title,
        description: page.extract,
      }),
    )
    .sort((left, right) => {
      const rightScore = scorePublicProfileMatch(entity, {
        canonicalName: right.title,
        description: right.extract,
      });
      const leftScore = scorePublicProfileMatch(entity, {
        canonicalName: left.title,
        description: left.extract,
      });
      return (
        rightScore - leftScore || (left.index ?? 999) - (right.index ?? 999)
      );
    });
  if (entity.kind !== "person") return compatible[0] ?? null;

  const humanIds = await getHumanWikidataIds(
    compatible
      .map((page) => normalizeWikidataId(page.pageprops?.wikibase_item))
      .filter((id): id is string => Boolean(id)),
  );
  return (
    compatible.find((page) => {
      const id = normalizeWikidataId(page.pageprops?.wikibase_item);
      return id ? humanIds.has(id) : false;
    }) ?? null
  );
}

async function getHumanWikidataIds(ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set();
  const url = new URL("https://www.wikidata.org/w/api.php");
  url.search = new URLSearchParams({
    action: "wbgetentities",
    format: "json",
    ids: [...new Set(ids)].join("|"),
    props: "claims",
  }).toString();
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "Jiddu/1.0 (https://jiddu.app; context enrichment)",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Wikidata returned ${response.status}`);
  }

  const payload = (await response.json()) as WikidataResponse;
  return new Set(
    Object.entries(payload.entities ?? {})
      .filter(([, wikidataEntity]) =>
        (wikidataEntity.claims?.P31 ?? []).some(
          (claim) => claim.mainsnak?.datavalue?.value?.id === "Q5",
        ),
      )
      .map(([id]) => id.toUpperCase()),
  );
}

function isCompleteWikipediaPage(
  page: WikipediaPage,
): page is CompleteWikipediaPage {
  return Boolean(page.title?.trim() && page.extract?.trim() && page.fullurl);
}

function toWikipediaProfile(
  page: CompleteWikipediaPage,
  language: Lang,
): WikipediaProfile {
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
