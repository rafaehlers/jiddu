export const CONTEXT_ANALYSIS_INTERVALS = [
  10_000, 20_000, 30_000, 60_000,
] as const;
export const CONTEXT_FACT_SOURCE_LIMITS = [1, 3, 5, 10] as const;

export type ContextSettings = {
  factSourceLimit: number;
  expandFactSources: boolean;
  showMiniMap: boolean;
  animateRelations: boolean;
  showActivityLog: boolean;
  automaticNews: boolean;
  analysisIntervalMs: number;
};

export const DEFAULT_CONTEXT_SETTINGS: ContextSettings = {
  factSourceLimit: 3,
  expandFactSources: false,
  showMiniMap: true,
  animateRelations: true,
  showActivityLog: true,
  automaticNews: true,
  analysisIntervalMs: 20_000,
};

export function readContextSettings(raw: string | null): ContextSettings {
  if (!raw) return { ...DEFAULT_CONTEXT_SETTINGS };
  try {
    return normalizeContextSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_CONTEXT_SETTINGS };
  }
}

export function normalizeContextSettings(value: unknown): ContextSettings {
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    factSourceLimit: includesNumber(
      CONTEXT_FACT_SOURCE_LIMITS,
      record.factSourceLimit,
    )
      ? record.factSourceLimit
      : DEFAULT_CONTEXT_SETTINGS.factSourceLimit,
    expandFactSources: booleanOrDefault(
      record.expandFactSources,
      DEFAULT_CONTEXT_SETTINGS.expandFactSources,
    ),
    showMiniMap: booleanOrDefault(
      record.showMiniMap,
      DEFAULT_CONTEXT_SETTINGS.showMiniMap,
    ),
    animateRelations: booleanOrDefault(
      record.animateRelations,
      DEFAULT_CONTEXT_SETTINGS.animateRelations,
    ),
    showActivityLog: booleanOrDefault(
      record.showActivityLog,
      DEFAULT_CONTEXT_SETTINGS.showActivityLog,
    ),
    automaticNews: booleanOrDefault(
      record.automaticNews,
      DEFAULT_CONTEXT_SETTINGS.automaticNews,
    ),
    analysisIntervalMs: includesNumber(
      CONTEXT_ANALYSIS_INTERVALS,
      record.analysisIntervalMs,
    )
      ? record.analysisIntervalMs
      : DEFAULT_CONTEXT_SETTINGS.analysisIntervalMs,
  };
}

function booleanOrDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function includesNumber(
  choices: readonly number[],
  value: unknown,
): value is number {
  return typeof value === "number" && choices.includes(value);
}
