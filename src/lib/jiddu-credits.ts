import "server-only";

import { prisma } from "@/lib/db";
import {
  JIDDU_CREDIT_RATE_VERSION,
  type JidduCreditFeature,
} from "@/lib/jiddu-credit-rates";
import {
  calculateJidduCreditSettlement,
  type JidduCreditSettlement,
  type OpenRouterUsage,
} from "@/lib/openrouter-usage";
import { loadSettings } from "@/lib/settings";

const RESERVATION_TTL_MS = 2 * 60 * 60 * 1000;

export type JidduCreditSnapshot = {
  balance: number;
  reserved: number;
  available: number;
};

export type JidduCreditReservationHandle = {
  id: string;
  amount: number;
  workosUserId: string;
};

export class InsufficientJidduCreditsError extends Error {
  constructor(
    public readonly required: number,
    public readonly available: number,
  ) {
    super(
      `This operation requires ${required} Jiddu credits; ${available} are available.`,
    );
    this.name = "InsufficientJidduCreditsError";
  }
}

export async function getJidduCreditSnapshot(
  workosUserId: string,
): Promise<JidduCreditSnapshot> {
  await releaseExpiredReservations(workosUserId);
  const account = await prisma.jidduCreditAccount.findUnique({
    where: { workosUserId },
    select: { balance: true, reserved: true },
  });
  const balance = account?.balance ?? 0;
  const reserved = account?.reserved ?? 0;
  return {
    balance,
    reserved,
    available: Math.max(0, balance - reserved),
  };
}

export async function hasAvailableJidduCredits(
  workosUserId: string,
): Promise<boolean> {
  return (await getJidduCreditSnapshot(workosUserId)).available > 0;
}

export async function reserveJidduCredits(input: {
  workosUserId: string;
  email: string;
  amount: number;
  feature: JidduCreditFeature;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<JidduCreditReservationHandle> {
  const amount = Math.max(0, Math.floor(input.amount));
  if (amount === 0) {
    return { id: "", amount: 0, workosUserId: input.workosUserId };
  }
  await releaseExpiredReservations(input.workosUserId);

  return prisma.$transaction(async (tx) => {
    const account = await tx.jidduCreditAccount.upsert({
      where: { workosUserId: input.workosUserId },
      create: {
        workosUserId: input.workosUserId,
        email: input.email.trim().toLowerCase(),
      },
      update: { email: input.email.trim().toLowerCase() },
    });
    const available = Math.max(0, account.balance - account.reserved);
    if (available < amount) {
      throw new InsufficientJidduCreditsError(amount, available);
    }

    await tx.jidduCreditAccount.update({
      where: { workosUserId: input.workosUserId },
      data: { reserved: { increment: amount } },
    });
    const reservation = await tx.jidduCreditReservation.create({
      data: {
        workosUserId: input.workosUserId,
        amount,
        feature: input.feature,
        resourceId: input.resourceId,
        rateVersion: JIDDU_CREDIT_RATE_VERSION,
        metadata: JSON.stringify(input.metadata ?? {}),
        expiresAt: new Date(Date.now() + RESERVATION_TTL_MS),
      },
    });
    return {
      id: reservation.id,
      amount,
      workosUserId: input.workosUserId,
    };
  });
}

export async function settleJidduCreditReservation(
  handle: JidduCreditReservationHandle | null,
  actualAmount: number,
  input?: {
    resourceId?: string;
    note?: string;
    metadata?: Record<string, unknown>;
    usage?: JidduCreditSettlement;
  },
): Promise<void> {
  if (!handle || !handle.id) return;
  // The reservation is an estimate, not a billing cap. Provider pricing,
  // retries and reasoning-token use can make the final cost exceed it. The
  // real debit is therefore allowed to overrun the reservation; a negative
  // balance blocks subsequent reservations until the account is topped up.
  const actual = Math.max(0, Math.floor(actualAmount));

  await prisma.$transaction(async (tx) => {
    const reservation = await tx.jidduCreditReservation.findUnique({
      where: { id: handle.id },
    });
    if (!reservation || reservation.status !== "pending") return;

    const account = await tx.jidduCreditAccount.update({
      where: { workosUserId: reservation.workosUserId },
      data: {
        balance: { decrement: actual },
        reserved: { decrement: reservation.amount },
      },
    });
    await tx.jidduCreditReservation.update({
      where: { id: reservation.id },
      data: {
        status: "settled",
        actualAmount: actual,
        resourceId: input?.resourceId ?? reservation.resourceId,
        settledAt: new Date(),
      },
    });
    if (actual > 0) {
      await tx.jidduCreditTransaction.create({
        data: {
          workosUserId: reservation.workosUserId,
          amount: -actual,
          balanceAfter: account.balance,
          kind: "usage",
          feature: reservation.feature,
          resourceId: input?.resourceId ?? reservation.resourceId,
          rateVersion: reservation.rateVersion,
          note: input?.note,
          metadata: JSON.stringify(input?.metadata ?? {}),
          promptTokens: input?.usage?.promptTokens,
          completionTokens: input?.usage?.completionTokens,
          totalTokens: input?.usage?.totalTokens,
          reasoningTokens: input?.usage?.reasoningTokens,
          cachedTokens: input?.usage?.cachedTokens,
          providerCostMicros: input?.usage?.providerCostMicros,
          billedCostMicros: input?.usage?.billedCostMicros,
          marginMultiplier: input?.usage?.marginMultiplier,
          usdPerCredit: input?.usage?.usdPerCredit,
        },
      });
    }
  });
}

export async function settleJidduCreditReservationFromUsage(
  handle: JidduCreditReservationHandle | null,
  input: {
    usages: readonly OpenRouterUsage[];
    fallbackModels: readonly string[];
    resourceId?: string;
    note?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<JidduCreditSettlement> {
  const settings = await loadSettings();
  const settlement = calculateJidduCreditSettlement(
    input.usages,
    input.fallbackModels,
    {
      marginMultiplier: settings["credits.marginMultiplier"],
      usdPerCredit: settings["credits.usdPerCredit"],
    },
  );
  await settleJidduCreditReservation(handle, settlement.credits, {
    resourceId: input.resourceId,
    note: input.note,
    usage: settlement,
    metadata: {
      ...(input.metadata ?? {}),
      usageAccounting: {
        provider: "openrouter",
        promptTokens: settlement.promptTokens,
        completionTokens: settlement.completionTokens,
        totalTokens: settlement.totalTokens,
        reasoningTokens: settlement.reasoningTokens,
        cachedTokens: settlement.cachedTokens,
        providerCostMicros: settlement.providerCostMicros,
        billedCostMicros: settlement.billedCostMicros,
        marginMultiplier: settlement.marginMultiplier,
        usdPerCredit: settlement.usdPerCredit,
        fallbackCredits: settlement.fallbackCredits,
        fallbackModels: settlement.fallbackModels,
        reservationEstimate: handle?.amount ?? 0,
        reservationOverrunCredits: Math.max(
          0,
          settlement.credits - (handle?.amount ?? 0),
        ),
        calls: settlement.calls,
      },
    },
  });
  return settlement;
}

export async function recordIncludedJidduCreditUsage(input: {
  workosUserId: string;
  email: string;
  feature: JidduCreditFeature;
  resourceId?: string;
  note?: string;
  metadata?: Record<string, unknown>;
  usage?: JidduCreditSettlement;
}): Promise<void> {
  const email = input.email.trim().toLowerCase();
  const usageAccounting = input.usage
    ? {
        provider: "openrouter",
        promptTokens: input.usage.promptTokens,
        completionTokens: input.usage.completionTokens,
        totalTokens: input.usage.totalTokens,
        reasoningTokens: input.usage.reasoningTokens,
        cachedTokens: input.usage.cachedTokens,
        providerCostMicros: input.usage.providerCostMicros,
        billedCostMicros: input.usage.billedCostMicros,
        marginMultiplier: input.usage.marginMultiplier,
        usdPerCredit: input.usage.usdPerCredit,
        fallbackCredits: input.usage.fallbackCredits,
        fallbackModels: input.usage.fallbackModels,
        calls: input.usage.calls,
      }
    : undefined;

  await prisma.$transaction(async (tx) => {
    const account = await tx.jidduCreditAccount.upsert({
      where: { workosUserId: input.workosUserId },
      create: {
        workosUserId: input.workosUserId,
        email,
      },
      update: { email },
    });
    await tx.jidduCreditTransaction.create({
      data: {
        workosUserId: input.workosUserId,
        amount: 0,
        balanceAfter: account.balance,
        kind: "included_usage",
        feature: input.feature,
        resourceId: input.resourceId,
        rateVersion: JIDDU_CREDIT_RATE_VERSION,
        note: input.note,
        metadata: JSON.stringify({
          ...(input.metadata ?? {}),
          billingMode: "platform",
          ...(usageAccounting ? { usageAccounting } : {}),
        }),
        promptTokens: input.usage?.promptTokens,
        completionTokens: input.usage?.completionTokens,
        totalTokens: input.usage?.totalTokens,
        reasoningTokens: input.usage?.reasoningTokens,
        cachedTokens: input.usage?.cachedTokens,
        providerCostMicros: input.usage?.providerCostMicros,
        billedCostMicros: input.usage?.billedCostMicros,
        marginMultiplier: input.usage?.marginMultiplier,
        usdPerCredit: input.usage?.usdPerCredit,
      },
    });
  });
}

export async function releaseJidduCreditReservation(
  handle: JidduCreditReservationHandle | null,
): Promise<void> {
  if (!handle || !handle.id) return;
  await prisma.$transaction(async (tx) => {
    const reservation = await tx.jidduCreditReservation.findUnique({
      where: { id: handle.id },
    });
    if (!reservation || reservation.status !== "pending") return;
    await tx.jidduCreditAccount.update({
      where: { workosUserId: reservation.workosUserId },
      data: { reserved: { decrement: reservation.amount } },
    });
    await tx.jidduCreditReservation.update({
      where: { id: reservation.id },
      data: { status: "released", actualAmount: 0, settledAt: new Date() },
    });
  });
}

export async function adjustJidduCredits(input: {
  workosUserId: string;
  email: string;
  amount: number;
  actorWorkosUserId: string;
  note?: string;
}): Promise<JidduCreditSnapshot> {
  const amount = Math.trunc(input.amount);
  if (amount === 0) throw new Error("Credit adjustment cannot be zero.");

  return prisma.$transaction(async (tx) => {
    const account = await tx.jidduCreditAccount.upsert({
      where: { workosUserId: input.workosUserId },
      create: {
        workosUserId: input.workosUserId,
        email: input.email.trim().toLowerCase(),
      },
      update: { email: input.email.trim().toLowerCase() },
    });
    const nextBalance = account.balance + amount;
    if (
      amount < 0 &&
      (nextBalance < account.reserved || nextBalance < 0)
    ) {
      throw new InsufficientJidduCreditsError(
        Math.abs(amount),
        Math.max(0, account.balance - account.reserved),
      );
    }
    const updated = await tx.jidduCreditAccount.update({
      where: { workosUserId: input.workosUserId },
      data: { balance: nextBalance },
    });
    await tx.jidduCreditTransaction.create({
      data: {
        workosUserId: input.workosUserId,
        amount,
        balanceAfter: updated.balance,
        kind: amount > 0 ? "grant" : "adjustment",
        note: input.note?.trim() || null,
        actorWorkosUserId: input.actorWorkosUserId,
      },
    });
    return {
      balance: updated.balance,
      reserved: updated.reserved,
      available: Math.max(0, updated.balance - updated.reserved),
    };
  });
}

async function releaseExpiredReservations(workosUserId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const expired = await tx.jidduCreditReservation.findMany({
      where: {
        workosUserId,
        status: "pending",
        expiresAt: { lt: new Date() },
      },
      select: { id: true, amount: true },
    });
    if (expired.length === 0) return;
    const released = expired.reduce((sum, item) => sum + item.amount, 0);
    await tx.jidduCreditReservation.updateMany({
      where: { id: { in: expired.map((item) => item.id) }, status: "pending" },
      data: { status: "expired", actualAmount: 0, settledAt: new Date() },
    });
    await tx.jidduCreditAccount.update({
      where: { workosUserId },
      data: { reserved: { decrement: released } },
    });
  });
}
