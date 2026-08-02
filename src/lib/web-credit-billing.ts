import "server-only";

import {
  InsufficientJidduCreditsError,
  recordIncludedJidduCreditUsage,
  reserveJidduCredits,
  settleJidduCreditReservationFromUsage,
  type JidduCreditReservationHandle,
} from "@/lib/jiddu-credits";
import type { JidduCreditFeature } from "@/lib/jiddu-credit-rates";
import type {
  JidduCreditSettlement,
  OpenRouterUsage,
} from "@/lib/openrouter-usage";
import {
  includedPlatformUsage,
  onceAnalysisSettlement,
  type AnalysisBillingAccess,
} from "@/lib/analysis-usage-policy";

type CreditBillableAccess = AnalysisBillingAccess;

export async function reserveWebAnalysisCredits(
  access: CreditBillableAccess,
  input: {
    amount: number;
    minimumAvailable?: number;
    feature: JidduCreditFeature;
    resourceId?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<JidduCreditReservationHandle | null | Response> {
  if (access.billing !== "jiddu") return null;
  if (!access.userId || !access.email) {
    return Response.json(
      { error: "The signed-in account could not be identified." },
      { status: 503 },
    );
  }
  try {
    return await reserveJidduCredits({
      workosUserId: access.userId,
      email: access.email,
      ...input,
    });
  } catch (error) {
    if (error instanceof InsufficientJidduCreditsError) {
      return Response.json(
        {
          error: error.message,
          code: "insufficient_jiddu_credits",
          required: error.required,
          available: error.available,
        },
        { status: 402 },
      );
    }
    throw error;
  }
}

export function isCreditResponse(
  value: JidduCreditReservationHandle | null | Response,
): value is Response {
  return value instanceof Response;
}

export function createWebAnalysisUsageSettlement(
  access: CreditBillableAccess,
  reservation: JidduCreditReservationHandle | null,
  context: {
    feature: JidduCreditFeature;
    resourceId?: string;
    metadata?: Record<string, unknown>;
  },
): (input: {
  usages: readonly OpenRouterUsage[];
  fallbackModels: readonly string[];
  resourceId?: string;
  note?: string;
  metadata?: Record<string, unknown>;
}) => Promise<JidduCreditSettlement> {
  return onceAnalysisSettlement((input) =>
    settleWebAnalysisUsage(access, reservation, {
      usages: input.usages,
      fallbackModels: input.fallbackModels,
      feature: context.feature,
      resourceId: input.resourceId ?? context.resourceId,
      note: input.note,
      metadata: {
        ...(context.metadata ?? {}),
        ...(input.metadata ?? {}),
      },
    }),
  );
}

async function settleWebAnalysisUsage(
  access: CreditBillableAccess,
  reservation: JidduCreditReservationHandle | null,
  input: {
    usages: readonly OpenRouterUsage[];
    fallbackModels: readonly string[];
    feature: JidduCreditFeature;
    resourceId?: string;
    note?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<JidduCreditSettlement> {
  const settlement = await settleJidduCreditReservationFromUsage(
    reservation,
    {
      usages: input.usages,
      fallbackModels: input.fallbackModels,
      resourceId: input.resourceId,
      note: input.note,
      metadata: input.metadata,
    },
  );
  const included = includedPlatformUsage(access, input, settlement);
  if (included) await recordIncludedJidduCreditUsage(included);
  return settlement;
}
