export type CacheSource = {
  sourceType: string;
  retrievedAt: string | Date;
};

export function normalizeKnowledgeName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function knowledgeCanonicalKey(type: string, name: string): string {
  return `${type}:${normalizeKnowledgeName(name)}`;
}

export function hasFreshKnowledgeSource(
  sources: readonly CacheSource[],
  sourceType: string,
  ttlMs: number,
  nowMs = Date.now(),
): boolean {
  const cutoff = nowMs - ttlMs;
  return sources.some((source) => {
    if (source.sourceType !== sourceType) return false;
    const retrievedAt =
      source.retrievedAt instanceof Date
        ? source.retrievedAt.getTime()
        : new Date(source.retrievedAt).getTime();
    return Number.isFinite(retrievedAt) && retrievedAt >= cutoff;
  });
}

export function hasKnowledgeSource(
  sources: readonly CacheSource[],
  sourceType: string,
): boolean {
  return sources.some((source) => source.sourceType === sourceType);
}

export function correctedProfileNeedsRefresh(
  correctedAt: string | null | undefined,
  profileFetchedAt: string | Date | null | undefined,
): boolean {
  if (!correctedAt) return false;
  const correctionTime = new Date(correctedAt).getTime();
  const fetchedTime = profileFetchedAt
    ? new Date(profileFetchedAt).getTime()
    : Number.NaN;
  return (
    Number.isFinite(correctionTime) &&
    (!Number.isFinite(fetchedTime) || fetchedTime < correctionTime)
  );
}
