import type { LiveAnalysisConfig } from "@/lib/live-analysis-config";
import {
  LiveContextSchema,
  type LiveContext,
} from "@/lib/live-context-schema";
import type { LiveClaim } from "@/lib/live/use-live-analysis";
import type { NeutralityFinding } from "@/lib/neutrality-schema";
import type { Finding } from "@/lib/schema";

export type ContextAnalysisConfigurationResult = {
  context: LiveContext;
  findings: Finding[];
  claims: LiveClaim[];
  neutralityFindings: NeutralityFinding[];
  verificationReset: boolean;
};

export async function updateContextAnalysisConfiguration(input: {
  sessionId: string;
  config: LiveAnalysisConfig;
  lang: "en" | "pt" | "es";
  elapsedMs?: number;
}): Promise<ContextAnalysisConfigurationResult> {
  const response = await fetch(
    `/api/context/sessions/${encodeURIComponent(input.sessionId)}/configuration`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        config: input.config,
        lang: input.lang,
        elapsedMs: input.elapsedMs,
      }),
    },
  );
  const payload = (await response.json().catch(() => null)) as
    | (ContextAnalysisConfigurationResult & { error?: string })
    | null;
  if (!response.ok || !payload) {
    throw new Error(payload?.error ?? "Configuration update failed");
  }
  const context = LiveContextSchema.safeParse(payload.context);
  if (
    !context.success ||
    !Array.isArray(payload.findings) ||
    !Array.isArray(payload.claims) ||
    !Array.isArray(payload.neutralityFindings)
  ) {
    throw new Error("Invalid analysis configuration response");
  }
  return { ...payload, context: context.data };
}
