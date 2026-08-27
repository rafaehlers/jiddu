"use client";

import { useState } from "react";
import {
  ANALYSIS_MODEL_CATALOG,
  GENERAL_PROVIDER_ROUTING_OPTIONS,
} from "@/lib/analysis-models";

type Props = {
  primaryModel: string;
  primaryProvider: string;
  fallbackModel: string;
  fallbackProvider: string;
};

function dollars(value: number): string {
  return value < 1 ? `$${value.toFixed(3)}` : `$${value.toFixed(2)}`;
}

function ModelProviderFields({
  role,
  model,
  provider,
  otherModel,
  onModelChange,
  onProviderChange,
}: {
  role: "primary" | "fallback";
  model: string;
  provider: string;
  otherModel: string;
  onModelChange: (value: string) => void;
  onProviderChange: (value: string) => void;
}) {
  const choice =
    ANALYSIS_MODEL_CATALOG.find((candidate) => candidate.id === model) ??
    ANALYSIS_MODEL_CATALOG[0];
  const providerIsValid =
    GENERAL_PROVIDER_ROUTING_OPTIONS.some((option) => option.id === provider) ||
    choice.providers.some((option) => option.id === provider);
  const selectedProvider = providerIsValid ? provider : "price";

  function changeModel(next: string) {
    onModelChange(next);
    onProviderChange("price");
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-rule bg-background/50 p-4">
      <div>
        <p className="font-medium">
          {role === "primary" ? "Primary model" : "Fallback model"}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {role === "primary"
            ? "Used first for every public analysis."
            : "Used automatically if the primary fails before producing output."}
        </p>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          Model
        </span>
        <select
          name={`analysis.${role}Model`}
          value={model}
          onChange={(event) => changeModel(event.target.value)}
          className="rounded-md border border-rule bg-background px-3 py-2 outline-none focus:border-accent"
        >
          {ANALYSIS_MODEL_CATALOG.map((candidate) => (
            <option
              key={candidate.id}
              value={candidate.id}
              disabled={candidate.id === otherModel}
            >
              {candidate.flag} {candidate.label} ({candidate.id})
            </option>
          ))}
        </select>
        <span className="text-xs text-muted">
          OpenRouter list price: {dollars(choice.inputUsdPerMillion)}/M input ·{" "}
          {dollars(choice.outputUsdPerMillion)}/M output
          {choice.reasoningEffort
            ? ` · reasoning ${choice.reasoningEffort}`
            : ""}
        </span>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          Provider routing
        </span>
        <select
          name={`analysis.${role}Provider`}
          value={selectedProvider}
          onChange={(event) => onProviderChange(event.target.value)}
          className="rounded-md border border-rule bg-background px-3 py-2 outline-none focus:border-accent"
        >
          <optgroup label="OpenRouter routing">
            {GENERAL_PROVIDER_ROUTING_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </optgroup>
          {choice.providers.length > 0 && (
            <optgroup label={`Providers for ${choice.label}`}>
              {choice.providers.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label} — {dollars(option.inputUsdPerMillion)}/M in ·{" "}
                  {dollars(option.outputUsdPerMillion)}/M out
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <span className="text-xs text-muted">
          A named provider is preferred first; OpenRouter may still fail over to
          another compatible endpoint. “Cheapest compatible” filters out
          endpoints that do not support Jiddu’s tool parameters.
        </span>
      </label>
    </div>
  );
}

export function AnalysisModelRoutingFields(props: Props) {
  const [primaryModel, setPrimaryModel] = useState(props.primaryModel);
  const [primaryProvider, setPrimaryProvider] = useState(props.primaryProvider);
  const [fallbackModel, setFallbackModel] = useState(props.fallbackModel);
  const [fallbackProvider, setFallbackProvider] = useState(props.fallbackProvider);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ModelProviderFields
        role="primary"
        model={primaryModel}
        provider={primaryProvider}
        otherModel={fallbackModel}
        onModelChange={setPrimaryModel}
        onProviderChange={setPrimaryProvider}
      />
      <ModelProviderFields
        role="fallback"
        model={fallbackModel}
        provider={fallbackProvider}
        otherModel={primaryModel}
        onModelChange={setFallbackModel}
        onProviderChange={setFallbackProvider}
      />
    </div>
  );
}
