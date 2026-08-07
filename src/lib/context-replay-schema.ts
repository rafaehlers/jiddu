import { z } from "zod";

export const CONTEXT_REPLAY_EVENT_KINDS = [
  "context_snapshot",
  "finding_detected",
  "claim_detected",
  "neutrality_finding_detected",
  "neutrality_assessed",
  "claim_verified",
] as const;

export const ContextReplayEventKindSchema = z.enum(
  CONTEXT_REPLAY_EVENT_KINDS,
);

export const ContextReplayEventSchema = z.object({
  id: z.string(),
  kind: ContextReplayEventKindSchema,
  elapsedMs: z.number().int().nonnegative(),
  sentenceIds: z.array(z.string()).default([]),
  payload: z.unknown(),
  createdAt: z.string().datetime(),
});

export type ContextReplayEvent = z.infer<typeof ContextReplayEventSchema>;

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
