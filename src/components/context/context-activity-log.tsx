"use client";

import { Activity, Bot, Cpu, Radio, Waypoints } from "lucide-react";
import { LIVE_TRANSCRIPTION_MODEL } from "@/lib/model-ids";
import type { ContextCopy } from "./context-copy";

type Props = {
  copy: ContextCopy;
  captureActive: boolean;
  analysisActive: boolean;
  analysisProcesses: number;
  analysisModel: string | null;
  analysisProvider: string | null;
  profileRequests: number;
  newsRequests: number;
  verificationRequests: number;
  newsModel: string;
  verificationModel: string;
};

type ActiveAgent = {
  id: string;
  label: string;
  processes: number;
  requests: number;
};

export function ContextActivityLog({
  copy,
  captureActive,
  analysisActive,
  analysisProcesses,
  analysisModel,
  analysisProvider,
  profileRequests,
  newsRequests,
  verificationRequests,
  newsModel,
  verificationModel,
}: Props) {
  const agents: ActiveAgent[] = [];
  if (captureActive) {
    agents.push({
      id: "capture",
      label: copy.captureAgent,
      processes: 1,
      requests: 1,
    });
  }
  if (analysisActive) {
    agents.push({
      id: "analysis",
      label: copy.analysisAgent,
      processes: Math.max(1, analysisProcesses),
      requests: 1,
    });
  }
  if (profileRequests > 0) {
    agents.push({
      id: "profiles",
      label: copy.profileAgent,
      processes: profileRequests,
      requests: profileRequests,
    });
  }
  if (newsRequests > 0) {
    agents.push({
      id: "news",
      label: copy.newsAgent,
      processes: newsRequests,
      requests: newsRequests,
    });
  }
  if (verificationRequests > 0) {
    agents.push({
      id: "verification",
      label: copy.verificationAgent,
      processes: verificationRequests,
      requests: verificationRequests,
    });
  }

  const processCount = agents.reduce(
    (total, agent) => total + agent.processes,
    0,
  );
  const requestCount = agents.reduce(
    (total, agent) => total + agent.requests,
    0,
  );
  const models = uniqueModels([
    captureActive ? { id: LIVE_TRANSCRIPTION_MODEL, provider: "OpenAI" } : null,
    analysisActive && analysisModel
      ? { id: analysisModel, provider: analysisProvider }
      : null,
    newsRequests > 0
      ? { id: newsModel, provider: "OpenRouter" }
      : null,
    verificationRequests > 0
      ? { id: verificationModel, provider: "OpenRouter" }
      : null,
  ]);

  return (
    <footer
      data-testid="context-activity-log"
      aria-label={copy.activityLog}
      className="relative z-[70] flex h-9 min-w-0 items-center border-t border-white/10 bg-neutral-950 px-3 font-mono text-[10px] text-neutral-300 shadow-[0_-8px_24px_rgba(0,0,0,0.18)]"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="inline-flex shrink-0 items-center gap-1.5 font-semibold tracking-[0.12em] text-neutral-100">
          <span
            className={`size-1.5 rounded-full ${agents.length > 0 ? "animate-pulse bg-emerald-400" : "bg-neutral-600"}`}
          />
          <Activity className="size-3.5" />
          {copy.activityLog}
        </span>

        <Metric icon={Bot} label={copy.activeAgents} value={agents.length} />
        <Metric icon={Cpu} label={copy.activeProcesses} value={processCount} />
        <Metric icon={Radio} label={copy.activeRequests} value={requestCount} />

        <span className="h-4 w-px shrink-0 bg-white/10" />
        <div className="flex shrink-0 items-center gap-1.5" aria-live="polite">
          {agents.length > 0 ? (
            agents.map((agent) => (
              <span
                key={agent.id}
                className="inline-flex items-center gap-1 rounded border border-emerald-400/20 bg-emerald-400/5 px-1.5 py-0.5 text-emerald-300"
              >
                <span className="size-1 rounded-full bg-emerald-400" />
                {agent.label}
                {agent.processes > 1 ? ` ×${agent.processes}` : ""}
              </span>
            ))
          ) : (
            <span className="text-neutral-500">{copy.awaitingActivity}</span>
          )}
        </div>
      </div>

      <div className="ml-3 hidden shrink-0 items-center gap-1.5 border-l border-white/10 pl-3 lg:flex">
        <Waypoints className="size-3.5 text-violet-300" />
        <span className="text-neutral-500">{copy.modelsInUse}</span>
        {models.length > 0 ? (
          models.map((model) => (
            <span
              key={model.id}
              title={model.provider ?? undefined}
              className="rounded border border-violet-400/20 bg-violet-400/5 px-1.5 py-0.5 text-violet-200"
            >
              {model.id}
            </span>
          ))
        ) : (
          <span className="text-neutral-600">—</span>
        )}
      </div>
    </footer>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Bot;
  label: string;
  value: number;
}) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-neutral-500">
      <Icon className="size-3" />
      {label}
      <strong className="font-semibold tabular-nums text-neutral-200">
        {value}
      </strong>
    </span>
  );
}

function uniqueModels(
  values: Array<{ id: string; provider: string | null } | null>,
) {
  const result = new Map<string, { id: string; provider: string | null }>();
  for (const value of values) {
    if (value) result.set(value.id, value);
  }
  return [...result.values()];
}
