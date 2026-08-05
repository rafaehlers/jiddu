export const LIVE_LENSES = [
  "context",
  "fallacy",
  "factcheck",
  "neutrality",
] as const;

export type LiveLens = (typeof LIVE_LENSES)[number];

export const DEFAULT_LIVE_LENSES: LiveLens[] = [...LIVE_LENSES];

export function normalizeLiveLenses(
  value: unknown,
  fallback: readonly LiveLens[] = ["context"],
): LiveLens[] {
  const normalizedFallback = LIVE_LENSES.filter((lens) =>
    fallback.includes(lens),
  );
  const safeFallback: LiveLens[] =
    normalizedFallback.length > 0 ? normalizedFallback : ["context"];

  if (!Array.isArray(value)) return [...safeFallback];

  const requested = new Set(
    value.filter((item): item is LiveLens =>
      LIVE_LENSES.includes(item as LiveLens),
    ),
  );

  const normalized = LIVE_LENSES.filter((lens) => requested.has(lens));
  return normalized.length > 0 ? normalized : [...safeFallback];
}
