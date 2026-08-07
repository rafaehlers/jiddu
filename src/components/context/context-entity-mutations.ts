import { LiveContextSchema, type LiveContext } from "@/lib/live-context-schema";
import type { LiveClaim } from "@/lib/live/use-live-analysis";

export type ContextEntityMutation =
  | {
      action: "rename";
      localEntityId: string;
      name: string;
      elapsedMs?: number;
    }
  | {
      action: "merge";
      sourceLocalEntityId: string;
      targetLocalEntityId: string;
      elapsedMs?: number;
    }
  | { action: "remove"; localEntityId: string; elapsedMs?: number };

export type ContextEntityMutationResult = {
  context: LiveContext;
  claims: LiveClaim[];
  verificationReset: boolean;
};

export async function mutateContextEntity(
  sessionId: string,
  mutation: ContextEntityMutation,
): Promise<ContextEntityMutationResult> {
  const response = await fetch(`/api/context/sessions/${sessionId}/entities`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(mutation),
  });
  const payload = (await response.json().catch(() => null)) as {
    context?: unknown;
    claims?: unknown;
    error?: string;
    verificationReset?: unknown;
  } | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? `Request failed (${response.status})`);
  }
  const context = LiveContextSchema.safeParse(payload?.context);
  if (!context.success || !Array.isArray(payload?.claims)) {
    throw new Error("Invalid context mutation response");
  }
  return {
    context: context.data,
    claims: payload.claims as LiveClaim[],
    verificationReset: payload?.verificationReset === true,
  };
}
