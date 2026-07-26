import { NextRequest } from "next/server";
import {
  curatedVenueSearch,
  type VenueKind,
  type VenueSearchResult,
} from "@/lib/venues";

export const runtime = "nodejs";
export const maxDuration = 10;

type DblpHit = {
  info?: {
    venue?: string;
    acronym?: string;
    type?: string;
    url?: string;
  };
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 100) ?? "";
  if (query.length < 2) return Response.json({ venues: [] });

  const curated = curatedVenueSearch(query);
  const dblp = await searchDblpVenues(query).catch(() => []);
  const seen = new Set(
    curated.map((venue) => normalizeVenueName(venue.acronym ?? venue.name)),
  );
  const merged = [...curated];
  for (const venue of dblp) {
    const key = normalizeVenueName(venue.acronym ?? venue.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(venue);
    if (merged.length >= 10) break;
  }

  return Response.json(
    { venues: merged },
    {
      headers: {
        "cache-control": "public, max-age=300, stale-while-revalidate=86400",
      },
    },
  );
}

export async function searchDblpVenues(
  query: string,
): Promise<VenueSearchResult[]> {
  const url = new URL("https://dblp.org/search/venue/api");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("h", "10");
  url.searchParams.set("c", "0");
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "Jiddu venue autocomplete (https://jiddu.app)",
    },
    signal: AbortSignal.timeout(4_000),
    next: { revalidate: 86_400 },
  });
  if (!response.ok) throw new Error(`DBLP venue search failed (${response.status})`);
  return parseDblpVenueResponse(await response.json());
}

export function parseDblpVenueResponse(payload: unknown): VenueSearchResult[] {
  const rawHits = (
    payload as {
      result?: { hits?: { hit?: DblpHit | DblpHit[] } };
    }
  )?.result?.hits?.hit;
  const hits = Array.isArray(rawHits) ? rawHits : rawHits ? [rawHits] : [];

  return hits.flatMap((hit, index) => {
    const name = hit.info?.venue?.trim();
    if (!name) return [];
    const catalogUrl = safeDblpUrl(hit.info?.url);
    return [
      {
        id: `dblp:${index}:${normalizeVenueName(name)}`,
        name,
        acronym: hit.info?.acronym?.trim() || undefined,
        kind: dblpKind(hit.info?.type),
        source: "dblp" as const,
        catalogUrl,
        verifiedProfile: false,
      },
    ];
  });
}

function dblpKind(value?: string): VenueKind {
  const normalized = value?.toLowerCase() ?? "";
  if (normalized.includes("journal")) return "journal";
  if (normalized.includes("conference") || normalized.includes("workshop")) {
    return "conference";
  }
  return "generic";
}

function safeDblpUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.hostname === "dblp.org"
      ? parsed.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function normalizeVenueName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}
