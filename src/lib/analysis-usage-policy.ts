import type { JidduCreditFeature } from "@/lib/jiddu-credit-rates";
import type { JidduCreditSettlement } from "@/lib/openrouter-usage";

export type AnalysisBillingAccess = {
  billing: "platform" | "jiddu";
  userId?: string;
  email?: string;
};

export type IncludedPlatformUsage = {
  workosUserId: string;
  email: string;
  feature: JidduCreditFeature;
  resourceId?: string;
  note: string;
  metadata?: Record<string, unknown>;
  usage: JidduCreditSettlement;
};

export function onceAnalysisSettlement<TInput, TResult>(
  settle: (input: TInput) => Promise<TResult>,
): (input: TInput) => Promise<TResult> {
  let settlementPromise: Promise<TResult> | null = null;
  return (input) => {
    settlementPromise ??= settle(input);
    return settlementPromise;
  };
}

export function includedPlatformUsage(
  access: AnalysisBillingAccess,
  input: {
    feature: JidduCreditFeature;
    resourceId?: string;
    note?: string;
    metadata?: Record<string, unknown>;
  },
  settlement: JidduCreditSettlement,
): IncludedPlatformUsage | null {
  if (access.billing !== "platform") return null;
  if (settlement.calls.length === 0 && settlement.fallbackModels.length === 0) {
    return null;
  }
  if (!access.userId || !access.email) {
    throw new Error("Platform usage requires an identified account.");
  }
  return {
    workosUserId: access.userId,
    email: access.email,
    feature: input.feature,
    resourceId: input.resourceId,
    note: input.note ?? "Included platform access",
    metadata: input.metadata,
    usage: settlement,
  };
}
