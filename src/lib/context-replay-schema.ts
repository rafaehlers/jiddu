import { z } from "zod";

export const CONTEXT_REPLAY_EVENT_KINDS = [
  "transcript_delta",
  "capture_state_changed",
  "context_snapshot",
  "finding_detected",
  "claim_detected",
  "neutrality_finding_detected",
  "neutrality_assessed",
  "claim_verified",
  "entity_renamed",
  "entities_merged",
  "entity_removed",
  "operation_started",
  "operation_completed",
] as const;

export const ContextReplayEventKindSchema = z.enum(
  CONTEXT_REPLAY_EVENT_KINDS,
);

export type ContextReplayEventKind = z.infer<
  typeof ContextReplayEventKindSchema
>;

export const ContextReplayEventSchema = z.object({
  id: z.string(),
  kind: ContextReplayEventKindSchema,
  elapsedMs: z.number().int().nonnegative(),
  sentenceIds: z.array(z.string()).default([]),
  payload: z.unknown(),
  createdAt: z.string().datetime(),
});

export type ContextReplayEvent = z.infer<typeof ContextReplayEventSchema>;

export const ClientContextReplayEventSchema = ContextReplayEventSchema.pick({
  id: true,
  kind: true,
  elapsedMs: true,
  sentenceIds: true,
  payload: true,
  createdAt: true,
}).superRefine((event, context) => {
  if (!event.id.startsWith("ctx_") || event.id.length > 120) {
    context.addIssue({
      code: "custom",
      message: "Invalid client event id.",
      path: ["id"],
    });
  }
  if (event.sentenceIds.length > 200) {
    context.addIssue({
      code: "custom",
      message: "Too many sentence references.",
      path: ["sentenceIds"],
    });
  }
  if (
    event.kind !== "transcript_delta" &&
    event.kind !== "capture_state_changed"
  ) {
    context.addIssue({
      code: "custom",
      message: "This client event kind cannot be persisted directly.",
      path: ["kind"],
    });
    return;
  }
  if (event.kind === "transcript_delta") {
    const delta = (event.payload as { delta?: unknown } | null)?.delta;
    if (typeof delta !== "string" || delta.length === 0 || delta.length > 20_000) {
      context.addIssue({
        code: "custom",
        message: "Invalid transcript delta.",
        path: ["payload"],
      });
    }
  } else {
    const payload = event.payload as {
      state?: unknown;
      source?: unknown;
    } | null;
    if (
      !payload ||
      !["connecting", "live", "stopping", "stopped", "error"].includes(
        String(payload.state),
      ) ||
      !["mic", "tab"].includes(String(payload.source))
    ) {
      context.addIssue({
        code: "custom",
        message: "Invalid capture state.",
        path: ["payload"],
      });
    }
  }
});

export function parseContextReplayEvent(input: {
  id: string;
  kind: string;
  elapsedMs: number;
  sentenceIds: string;
  payload: string;
  createdAt: Date;
}): ContextReplayEvent | null {
  const parsed = ContextReplayEventSchema.safeParse({
    id: input.id,
    kind: input.kind,
    elapsedMs: input.elapsedMs,
    sentenceIds: parseJson(input.sentenceIds, []),
    payload: parseJson(input.payload, null),
    createdAt: input.createdAt.toISOString(),
  });
  return parsed.success ? parsed.data : null;
}

function parseJson<T>(value: string, fallback: T): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
