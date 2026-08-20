import "server-only";

import type { Lang } from "./fallacies";
import {
  buildContextualWikipediaQuery,
  isPublicProfileCompatible,
  isWikidataTypeCompatible,
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
    P279?: Array<{
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
  if (!entity.kind) return compatible[0] ?? null;

  const compatibleIds = await getTypeCompatibleWikidataIds(
    compatible
      .map((page) => normalizeWikidataId(page.pageprops?.wikibase_item))
      .filter((id): id is string => Boolean(id)),
    entity.kind,
  );
  return (
    compatible.find((page) => {
      const id = normalizeWikidataId(page.pageprops?.wikibase_item);
      return id ? compatibleIds.has(id) : false;
    }) ?? null
  );
}

async function getTypeCompatibleWikidataIds(
  ids: string[],
  kind: NonNullable<EntityProfileHint["kind"]>,
): Promise<Set<string>> {
  if (!ids.length) return new Set();
  const candidates = await fetchWikidataEntities(ids);
  const parentMap = new Map<string, string[]>();
  let frontier = new Set(
    Object.values(candidates).flatMap((entity) => claimIds(entity, "P31")),
  );
  for (let depth = 0; depth < 3 && frontier.size > 0; depth += 1) {
    const classes = await fetchWikidataEntities([...frontier]);
    const next = new Set<string>();
    for (const [id, entity] of Object.entries(classes)) {
      const parents = claimIds(entity, "P279");
      parentMap.set(id.toUpperCase(), parents);
      for (const parent of parents) {
        if (!parentMap.has(parent)) next.add(parent);
      }
    }
    frontier = next;
  }

  const result = new Set<string>();
  for (const [id, entity] of Object.entries(candidates)) {
    const closure = typeClosure(claimIds(entity, "P31"), parentMap);
    if (isWikidataTypeCompatible(kind, closure)) result.add(id.toUpperCase());
  }
  return result;
}

async function fetchWikidataEntities(
  ids: string[],
): Promise<Record<string, WikidataEntity>> {
  if (!ids.length) return {};
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
  return payload.entities ?? {};
}

function claimIds(
  entity: WikidataEntity,
  property: "P31" | "P279",
): string[] {
  return (entity.claims?.[property] ?? [])
    .map((claim) => normalizeWikidataId(claim.mainsnak?.datavalue?.value?.id))
    .filter((id): id is string => Boolean(id));
}

function typeClosure(
  directTypes: string[],
  parentMap: ReadonlyMap<string, string[]>,
): Set<string> {
  const closure = new Set(directTypes.map((id) => id.toUpperCase()));
  let frontier = [...closure];
  while (frontier.length > 0) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const parent of parentMap.get(id) ?? []) {
        if (closure.has(parent)) continue;
        closure.add(parent);
        next.push(parent);
      }
    }
    frontier = next;
  }
  return closure;
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
