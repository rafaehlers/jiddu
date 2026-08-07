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
    const value = JSON.parse(raw) as Record<string, unknown>;
    return {
      factSourceLimit: includesNumber(
        CONTEXT_FACT_SOURCE_LIMITS,
        value.factSourceLimit,
      )
        ? value.factSourceLimit
        : DEFAULT_CONTEXT_SETTINGS.factSourceLimit,
      expandFactSources: booleanOrDefault(
        value.expandFactSources,
        DEFAULT_CONTEXT_SETTINGS.expandFactSources,
      ),
      showMiniMap: booleanOrDefault(
        value.showMiniMap,
        DEFAULT_CONTEXT_SETTINGS.showMiniMap,
      ),
      animateRelations: booleanOrDefault(
        value.animateRelations,
        DEFAULT_CONTEXT_SETTINGS.animateRelations,
      ),
      showActivityLog: booleanOrDefault(
        value.showActivityLog,
        DEFAULT_CONTEXT_SETTINGS.showActivityLog,
      ),
      automaticNews: booleanOrDefault(
        value.automaticNews,
        DEFAULT_CONTEXT_SETTINGS.automaticNews,
      ),
      analysisIntervalMs: includesNumber(
        CONTEXT_ANALYSIS_INTERVALS,
        value.analysisIntervalMs,
      )
        ? value.analysisIntervalMs
        : DEFAULT_CONTEXT_SETTINGS.analysisIntervalMs,
    };
  } catch {
    return { ...DEFAULT_CONTEXT_SETTINGS };
  }
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
