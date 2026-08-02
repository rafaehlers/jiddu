import "server-only";

import type { JidduCreditFeature } from "@/lib/jiddu-credit-rates";
import type { OpenRouterUsage } from "@/lib/openrouter-usage";
import {
  createWebAnalysisUsageSettlement,
  isCreditResponse,
  reserveWebAnalysisCredits,
} from "@/lib/web-credit-billing";

export type ApiCreditMeter = {
  recordModel(model: string): void;
  recordUsage(usage: OpenRouterUsage): void;
  recordVerification(event: {
    model: string;
    cached: boolean;
    usage?: OpenRouterUsage;
  }): void;
  settle(input?: {
    resourceId?: string;
    note?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
};

export type CreditMeterAccess = {
  billing: "platform" | "jiddu";
  userId?: string;
  email?: string;
};

export async function createApiCreditMeter(
  auth: CreditMeterAccess,
  input: {
    amount: number;
    feature: JidduCreditFeature;
    resourceId?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<ApiCreditMeter | Response> {
  const reservation = await reserveWebAnalysisCredits(auth, input);
  if (isCreditResponse(reservation)) return reservation;
  const settleUsage = createWebAnalysisUsageSettlement(auth, reservation, {
    feature: input.feature,
    resourceId: input.resourceId,
    metadata: input.metadata,
  });

  const models: string[] = [];
  const usages: OpenRouterUsage[] = [];
  let settled = false;
  return {
    recordModel(model) {
      models.push(model);
    },
    recordUsage(usage) {
      usages.push(usage);
    },
    recordVerification(event) {
      if (!event.cached) {
        models.push(event.model);
        if (event.usage) usages.push(event.usage);
      }
    },
    async settle(settlement) {
      if (settled) return;
      settled = true;
      await settleUsage({
        usages,
        fallbackModels: models,
        resourceId: settlement?.resourceId,
        note: settlement?.note,
        metadata: {
          models,
          ...(settlement?.metadata ?? {}),
        },
      });
    },
  };
}

export function isApiCreditResponse(
  value: ApiCreditMeter | Response,
): value is Response {
  return value instanceof Response;
}
