import type { Lang } from "./fallacies";
import type { LiveContextEntityKind } from "./live-context-schema";

export type EntityProfileHint = {
  name: string;
  aliases?: readonly string[];
  description?: string | null;
  kind?: LiveContextEntityKind;
};

export type PublicProfileIdentity = {
  canonicalName: string;
  description?: string | null;
};

const KIND_SEARCH_TERMS: Record<
  Lang,
  Partial<Record<LiveContextEntityKind, string>>
> = {
  en: {
    person: "person",
    institution: "institution",
    organization: "organization",
    country: "country",
    event: "event",
  },
  pt: {
    person: "pessoa",
    institution: "instituição",
    organization: "organização",
    country: "país",
    event: "evento",
  },
  es: {
    person: "persona",
    institution: "institución",
    organization: "organización",
    country: "país",
    event: "evento",
  },
};

const CONTEXT_STOP_WORDS = new Set([
  "about",
  "after",
  "also",
  "como",
  "com",
  "con",
  "contra",
  "da",
  "das",
  "de",
  "del",
  "do",
  "dos",
  "durante",
  "e",
  "el",
  "en",
  "es",
  "esta",
  "este",
  "for",
  "from",
  "has",
  "have",
  "informa",
  "informou",
  "is",
  "la",
  "los",
  "mais",
  "mas",
  "não",
  "nao",
  "of",
  "para",
  "pela",
  "pelo",
  "por",
  "que",
  "sem",
  "sobre",
  "the",
  "to",
  "uma",
  "uno",
  "with",
  "y",
]);

export function isPublicProfileCompatible(
  entity: EntityProfileHint,
  profile: PublicProfileIdentity,
): boolean {
  const identityNames = uniqueNormalized([
    entity.name,
    ...(entity.aliases ?? []),
  ]);
  const canonicalName = normalizeProfileText(profile.canonicalName);
  const description = normalizeProfileText(profile.description ?? "");
  const publicText = `${canonicalName} ${description}`.trim();

  if (!identityNames.length || !publicText) return false;

  return identityNames.some((identityName) => {
    if (
      containsPhrase(canonicalName, identityName) ||
      containsPhrase(identityName, canonicalName) ||
      containsPhrase(description, identityName)
    ) {
      return true;
    }

    const identityTokens = significantIdentityTokens(identityName);
    if (!identityTokens.length) return false;
    const canonicalTokens = new Set(significantIdentityTokens(canonicalName));
    const descriptionTokens = new Set(significantIdentityTokens(description));
    const canonicalMatches = identityTokens.filter((token) =>
      canonicalTokens.has(token),
    ).length;

    if (identityTokens.length === 1) {
      const [token] = identityTokens;
      return canonicalTokens.has(token) || descriptionTokens.has(token);
    }

    return canonicalMatches >= Math.ceil(identityTokens.length / 2);
  });
}

export function buildContextualWikipediaQuery(
  entity: EntityProfileHint,
  language: Lang,
): string {
  const contextTerms: string[] = [];
  const seen = new Set(
    uniqueNormalized([entity.name, ...(entity.aliases ?? [])]).flatMap(
      significantIdentityTokens,
    ),
  );

  contextTerms.push(
    ...extractContextTerms(entity.description ?? "", seen).slice(0, 8),
  );

  const kindTerm =
    entity.kind && contextTerms.length === 0
      ? KIND_SEARCH_TERMS[language][entity.kind]
      : undefined;
  return [entity.name.trim(), kindTerm, ...contextTerms]
    .filter(Boolean)
    .join(" ")
    .slice(0, 300);
}

export function scorePublicProfileMatch(
  entity: EntityProfileHint,
  profile: PublicProfileIdentity,
): number {
  if (!isPublicProfileCompatible(entity, profile)) {
    return Number.NEGATIVE_INFINITY;
  }

  const identityNames = uniqueNormalized([
    entity.name,
    ...(entity.aliases ?? []),
  ]);
  const canonicalName = normalizeProfileText(profile.canonicalName);
  const description = normalizeProfileText(profile.description ?? "");
  let score = 0;

  for (const identityName of identityNames) {
    if (canonicalName === identityName) score = Math.max(score, 120);
    else if (containsPhrase(canonicalName, identityName)) {
      score = Math.max(score, 35);
    }
    if (containsPhrase(description, `como ${identityName}`)) score += 80;
    if (containsPhrase(description, `as ${identityName}`)) score += 50;
    if (containsPhrase(description, identityName)) score += 10;
  }

  const publicTokens = new Set(significantIdentityTokens(description));
  const identityTokens = new Set(
    identityNames.flatMap(significantIdentityTokens),
  );
  const contextTerms = extractContextTerms(
    entity.description ?? "",
    identityTokens,
  );
  score += contextTerms.filter((token) => publicTokens.has(token)).length * 4;
  return score;
}

function containsPhrase(haystack: string, needle: string): boolean {
  if (!haystack || !needle) return false;
  return ` ${haystack} `.includes(` ${needle} `);
}

function significantIdentityTokens(value: string): string[] {
  return value.split(" ").filter((token) => token.length >= 2);
}

function extractContextTerms(value: string, excluded: Set<string>): string[] {
  const terms: string[] = [];
  const seen = new Set(excluded);
  for (const token of normalizeProfileText(value).split(" ")) {
    if (
      token.length < 2 ||
      CONTEXT_STOP_WORDS.has(token) ||
      seen.has(token)
    ) {
      continue;
    }
    seen.add(token);
    terms.push(token);
  }
  return terms;
}

function uniqueNormalized(values: readonly string[]): string[] {
  return [...new Set(values.map(normalizeProfileText).filter(Boolean))];
}

function normalizeProfileText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
