import type { ProviderRoutingPreference } from "@/lib/analysis-models";
import { loadStringSettings, type StringSettings } from "@/lib/settings";

export type AnalysisRouting = {
  modelChain: string[];
  providerRoutingByModel: Record<string, ProviderRoutingPreference>;
};

export function analysisRoutingFromSettings(
  settings: Pick<
    StringSettings,
    | "analysis.primaryModel"
    | "analysis.fallbackModel"
    | "analysis.primaryProvider"
    | "analysis.fallbackProvider"
  >,
): AnalysisRouting {
  const primary = settings["analysis.primaryModel"];
  const fallback = settings["analysis.fallbackModel"];
  return {
    modelChain: Array.from(new Set([primary, fallback])),
    providerRoutingByModel: {
      [primary]: settings["analysis.primaryProvider"],
      [fallback]: settings["analysis.fallbackProvider"],
    },
  };
}

export async function loadAnalysisRouting(): Promise<AnalysisRouting> {
  return analysisRoutingFromSettings(await loadStringSettings());
}
