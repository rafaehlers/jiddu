import { prisma } from "@/lib/db";

type StageFinishedEvent = {
  stageIndex: number;
  stage: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  error?: string;
};

type CallFinishedEvent = {
  callId: string;
  stageIndex: number;
  stage: string;
  operation: string;
  model: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  error?: string;
};

export type PaperReviewTelemetryEvent =
  | {
      kind: "stage_started";
      stageIndex: number;
      stage: string;
      at: string;
    }
  | ({ kind: "stage_completed" } & StageFinishedEvent)
  | ({ kind: "stage_failed" } & StageFinishedEvent)
  | {
      kind: "call_started";
      callId: string;
      stageIndex: number;
      stage: string;
      operation: string;
      model: string;
      startedAt: string;
    }
  | ({ kind: "call_completed" } & CallFinishedEvent)
  | ({ kind: "call_failed" } & CallFinishedEvent);

export type PaperReviewCallTiming = {
  id: string;
  operation: string;
  model: string;
  status: "running" | "complete" | "failed";
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  error: string | null;
};

export type PaperReviewStageTiming = {
  index: number;
  name: string;
  status: "running" | "complete" | "failed";
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  error: string | null;
  calls: PaperReviewCallTiming[];
};

export async function appendPaperReviewTelemetry(
  paperReviewId: string,
  event: PaperReviewTelemetryEvent,
): Promise<void> {
  const payload = JSON.stringify([event]);
  try {
    await prisma.$executeRaw`
      UPDATE "PaperReview"
      SET "telemetry" = (
        COALESCE(NULLIF("telemetry", ''), '[]')::jsonb || ${payload}::jsonb
      )::text
      WHERE id = ${paperReviewId}
    `;
  } catch (error) {
    console.warn(
      `[paper-review:${paperReviewId}:telemetry]`,
      error instanceof Error ? error.message : error,
    );
  }
}

export function summarizePaperReviewTelemetry(
  value: string | null | undefined,
): PaperReviewStageTiming[] {
  const events = parseEvents(value);
  const stages = new Map<number, PaperReviewStageTiming>();
  const calls = new Map<string, PaperReviewCallTiming & { stageIndex: number }>();

  const ensureStage = (
    stageIndex: number,
    name: string,
    startedAt: string,
  ) => {
    const existing = stages.get(stageIndex);
    if (existing) return existing;
    const timing: PaperReviewStageTiming = {
      index: stageIndex,
      name,
      status: "running",
      startedAt,
      finishedAt: null,
      durationMs: null,
      error: null,
      calls: [],
    };
    stages.set(stageIndex, timing);
    return timing;
  };

  for (const event of events) {
    if (event.kind === "stage_started") {
      ensureStage(event.stageIndex, event.stage, event.at);
      continue;
    }

    if (event.kind === "stage_completed" || event.kind === "stage_failed") {
      const stage = ensureStage(
        event.stageIndex,
        event.stage,
        event.startedAt,
      );
      stage.status = event.kind === "stage_completed" ? "complete" : "failed";
      stage.finishedAt = event.finishedAt;
      stage.durationMs = event.durationMs;
      stage.error = event.error ?? null;
      continue;
    }

    if (event.kind === "call_started") {
      ensureStage(event.stageIndex, event.stage, event.startedAt);
      calls.set(event.callId, {
        id: event.callId,
        stageIndex: event.stageIndex,
        operation: event.operation,
        model: event.model,
        status: "running",
        startedAt: event.startedAt,
        finishedAt: null,
        durationMs: null,
        error: null,
      });
      continue;
    }

    ensureStage(event.stageIndex, event.stage, event.startedAt);
    const existing = calls.get(event.callId);
    calls.set(event.callId, {
      id: event.callId,
      stageIndex: event.stageIndex,
      operation: event.operation,
      model: event.model,
      status: event.kind === "call_completed" ? "complete" : "failed",
      startedAt: existing?.startedAt ?? event.startedAt,
      finishedAt: event.finishedAt,
      durationMs: event.durationMs,
      error: event.error ?? null,
    });
  }

  for (const call of calls.values()) {
    const stage = stages.get(call.stageIndex);
    if (!stage) continue;
    const { stageIndex: _stageIndex, ...timing } = call;
    void _stageIndex;
    stage.calls.push(timing);
  }

  return Array.from(stages.values())
    .sort((a, b) => a.index - b.index)
    .map((stage) => ({
      ...stage,
      calls: stage.calls.sort((a, b) =>
        a.startedAt.localeCompare(b.startedAt),
      ),
    }));
}

function parseEvents(
  value: string | null | undefined,
): PaperReviewTelemetryEvent[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTelemetryEvent);
  } catch {
    return [];
  }
}

function isTelemetryEvent(value: unknown): value is PaperReviewTelemetryEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Record<string, unknown>;
  if (
    typeof event.kind !== "string" ||
    typeof event.stageIndex !== "number" ||
    typeof event.stage !== "string"
  ) {
    return false;
  }
  if (event.kind === "stage_started") return typeof event.at === "string";
  if (event.kind === "stage_completed" || event.kind === "stage_failed") {
    return (
      typeof event.startedAt === "string" &&
      typeof event.finishedAt === "string" &&
      typeof event.durationMs === "number"
    );
  }
  if (
    event.kind === "call_started" ||
    event.kind === "call_completed" ||
    event.kind === "call_failed"
  ) {
    const base =
      typeof event.callId === "string" &&
      typeof event.operation === "string" &&
      typeof event.model === "string" &&
      typeof event.startedAt === "string";
    return event.kind === "call_started"
      ? base
      : base &&
          typeof event.finishedAt === "string" &&
          typeof event.durationMs === "number";
  }
  return false;
}
