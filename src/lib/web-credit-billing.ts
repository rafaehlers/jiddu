import "server-only";

import {
  InsufficientJidduCreditsError,
  reserveJidduCredits,
  type JidduCreditReservationHandle,
} from "@/lib/jiddu-credits";
import type { JidduCreditFeature } from "@/lib/jiddu-credit-rates";
type CreditBillableAccess = {
  billing: "platform" | "jiddu";
  userId?: string;
  email?: string;
};

export async function reserveWebAnalysisCredits(
  access: CreditBillableAccess,
  input: {
    amount: number;
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
