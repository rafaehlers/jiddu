import "server-only";

import type { ContextReplayEvent } from "./context-replay-schema";
import { prisma } from "./db";

type ReplayEventWrite = Pick<
  ContextReplayEvent,
  "kind" | "elapsedMs" | "sentenceIds" | "payload"
>;

export async function recordContextSessionEvents(input: {
  analysisId: string;
  ownerWorkosUserId: string | null;
  events: ReplayEventWrite[];
}): Promise<void> {
  if (input.events.length === 0) return;
  await prisma.contextSessionEvent.createMany({
    data: input.events.map((event) => ({
      analysisId: input.analysisId,
      ownerWorkosUserId: input.ownerWorkosUserId,
      kind: event.kind,
      elapsedMs: Math.max(0, Math.floor(event.elapsedMs)),
      sentenceIds: JSON.stringify(event.sentenceIds),
      payload: JSON.stringify(event.payload),
    })),
  });
}
