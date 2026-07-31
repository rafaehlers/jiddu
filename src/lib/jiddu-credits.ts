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
import {
  addLiveAnalysisUsage,
  calculateLiveTranscriptionSettlement,
  LIVE_TRANSCRIPTION_MODEL,
  normalizeLiveDurationMs,
  type LiveAnalysisUsageTotals,
  type LiveTranscriptionSettlement,
} from "@/lib/live-billing";
import { loadSettings } from "@/lib/settings";

const RESERVATION_TTL_MS = 2 * 60 * 60 * 1000;
const LIVE_ANALYSIS_USAGE_KEY = "liveAnalysisUsage";

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
  minimumAvailable?: number;
  feature: JidduCreditFeature;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<JidduCreditReservationHandle> {
  const amount = Math.max(0, Math.floor(input.amount));
  const minimumAvailable = Math.max(
    amount,
    Math.max(0, Math.floor(input.minimumAvailable ?? 0)),
  );
  if (amount === 0 && minimumAvailable === 0) {
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
    if (available < minimumAvailable) {
      throw new InsufficientJidduCreditsError(minimumAvailable, available);
    }

    if (amount > 0) {
      await tx.jidduCreditAccount.update({
        where: { workosUserId: input.workosUserId },
        data: { reserved: { increment: amount } },
      });
    }
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
): Promise<boolean> {
  if (!handle || !handle.id) return false;
  // The reservation is an estimate, not a billing cap. Provider pricing,
  // retries and reasoning-token use can make the final cost exceed it. The
  // real debit is therefore allowed to overrun the reservation; a negative
  // balance blocks subsequent reservations until the account is topped up.
  const actual = Math.max(0, Math.floor(actualAmount));

  return prisma.$transaction(async (tx) => {
    const reservation = await tx.jidduCreditReservation.findUnique({
      where: { id: handle.id },
    });
    if (!reservation || reservation.status !== "pending") return false;

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
    return true;
  });
}

export async function settleLiveTranscriptionReservation(input: {
  reservationId: string;
  workosUserId: string;
  durationMs: number;
  resourceId?: string;
}): Promise<{
  settlement: LiveTranscriptionSettlement;
  didSettle: boolean;
} | null> {
  const settings = await loadSettings();
  const durationMs = normalizeLiveDurationMs(input.durationMs);

  // Read accumulated analysis usage and close the ticket in the same
  // transaction. If an analysis finishes first, it is included here. If this
  // settlement wins the race, that analysis sees a closed ticket and falls
  // back to its own normal credit transaction.
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.jidduCreditReservation.findFirst({
      where: {
        id: input.reservationId,
        workosUserId: input.workosUserId,
        feature: "live_transcription",
      },
    });
    if (!reservation) return null;

    // Lock a session to the economics that were active when its client
    // secret was issued. Older pending tickets fall back to current settings.
    const reservationMetadata = parseMetadata(reservation.metadata);
    const marginMultiplier = positiveNumber(
      reservationMetadata.marginMultiplier,
      settings["credits.marginMultiplier"],
    );
    const usdPerCredit = positiveNumber(
      reservationMetadata.usdPerCredit,
      settings["credits.usdPerCredit"],
    );
    const usdPerMinute = positiveNumber(
      reservationMetadata.usdPerMinute,
      settings["credits.liveTranscriptionUsdPerMinute"],
    );
    const entryMinimumCredits = nonNegativeInteger(
      reservationMetadata.entryMinimumCredits,
      Math.ceil(settings["credits.liveTranscription"]),
    );
    const settlement = calculateLiveTranscriptionSettlement(
      durationMs,
      {
        marginMultiplier,
        usdPerCredit,
        usdPerMinute,
      },
      readLiveAnalysisUsage(reservation.metadata),
    );
    if (reservation.status !== "pending") {
      return { settlement, didSettle: false };
    }

    const resourceId = input.resourceId ?? reservation.resourceId;
    const account = await tx.jidduCreditAccount.update({
      where: { workosUserId: reservation.workosUserId },
      data: {
        balance: { decrement: settlement.credits },
        reserved: { decrement: reservation.amount },
      },
    });
    await tx.jidduCreditReservation.update({
      where: { id: reservation.id },
      data: {
        status: "settled",
        actualAmount: settlement.credits,
        resourceId,
        settledAt: new Date(),
      },
    });
    if (settlement.credits > 0) {
      await tx.jidduCreditTransaction.create({
        data: {
          workosUserId: reservation.workosUserId,
          amount: -settlement.credits,
          balanceAfter: account.balance,
          kind: "usage",
          feature: reservation.feature,
          resourceId,
          rateVersion: reservation.rateVersion,
          note:
            settlement.analysisWindows > 0
              ? "Live transcription and analysis usage"
              : "OpenAI Live transcription usage",
          metadata: JSON.stringify({
            model: LIVE_TRANSCRIPTION_MODEL,
            durationMs: settlement.durationMs,
            usdPerMinute: settlement.usdPerMinute,
            analysisWindows: settlement.analysisWindows,
            usageAccounting: {
              provider: settlement.provider,
              providerCostMicros: settlement.providerCostMicros,
              transcriptionProviderCostMicros:
                settlement.transcriptionProviderCostMicros,
              analysisProviderCostMicros:
                settlement.analysisProviderCostMicros,
              billedCostMicros: settlement.billedCostMicros,
              marginMultiplier: settlement.marginMultiplier,
              usdPerCredit: settlement.usdPerCredit,
              promptTokens: settlement.promptTokens,
              completionTokens: settlement.completionTokens,
              totalTokens: settlement.totalTokens,
              reasoningTokens: settlement.reasoningTokens,
              cachedTokens: settlement.cachedTokens,
              fallbackCredits: settlement.fallbackCredits,
              fallbackModels: settlement.fallbackModels,
              entryMinimumCredits,
            },
          }),
          promptTokens: settlement.promptTokens,
          completionTokens: settlement.completionTokens,
          totalTokens: settlement.totalTokens,
          reasoningTokens: settlement.reasoningTokens,
          cachedTokens: settlement.cachedTokens,
          providerCostMicros: settlement.providerCostMicros,
          billedCostMicros: settlement.billedCostMicros,
          marginMultiplier: settlement.marginMultiplier,
          usdPerCredit: settlement.usdPerCredit,
        },
      });
    }

    return { settlement, didSettle: true };
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
    aggregateIntoLive?: {
      reservationId: string;
      workosUserId: string;
    };
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
  if (
    input.aggregateIntoLive &&
    (await appendLiveAnalysisUsage({
      ...input.aggregateIntoLive,
      settlement,
      resourceId: input.resourceId,
    }))
  ) {
    await releaseJidduCreditReservation(handle);
    return settlement;
  }
  await settleJidduCreditReservation(handle, settlement.credits, {
    resourceId: input.resourceId,
    note: input.note,
    usage: settlement,
    metadata: {
      ...(input.metadata ?? {}),
      usageAccounting: {
        provider: settlement.provider,
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

async function appendLiveAnalysisUsage(input: {
  reservationId: string;
  workosUserId: string;
  settlement: JidduCreditSettlement;
  resourceId?: string;
}): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.jidduCreditReservation.findFirst({
      where: {
        id: input.reservationId,
        workosUserId: input.workosUserId,
        feature: "live_transcription",
        status: "pending",
      },
      select: { id: true, metadata: true },
    });
    if (!reservation) return false;

    const metadata = parseMetadata(reservation.metadata);
    const current = readLiveAnalysisUsage(reservation.metadata);
    const next = addLiveAnalysisUsage(current, input.settlement);

    await tx.jidduCreditReservation.update({
      where: { id: reservation.id },
      data: {
        resourceId: input.resourceId,
        metadata: JSON.stringify({
          ...metadata,
          [LIVE_ANALYSIS_USAGE_KEY]: next,
        }),
      },
    });
    return true;
  });
}

function readLiveAnalysisUsage(metadataJson: string): LiveAnalysisUsageTotals {
  const value = parseMetadata(metadataJson)[LIVE_ANALYSIS_USAGE_KEY];
  const usage =
    value !== null && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  return {
    providerCostMicros: nonNegativeInteger(usage.providerCostMicros),
    promptTokens: nonNegativeInteger(usage.promptTokens),
    completionTokens: nonNegativeInteger(usage.completionTokens),
    totalTokens: nonNegativeInteger(usage.totalTokens),
    reasoningTokens: nonNegativeInteger(usage.reasoningTokens),
    cachedTokens: nonNegativeInteger(usage.cachedTokens),
    fallbackCredits: nonNegativeInteger(usage.fallbackCredits),
    fallbackModels: Array.isArray(usage.fallbackModels)
      ? usage.fallbackModels.filter(
          (model): model is string => typeof model === "string",
        )
      : [],
    analysisWindows: nonNegativeInteger(usage.analysisWindows),
  };
}

function parseMetadata(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    return parsed !== null && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function nonNegativeInteger(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : fallback;
}

function positiveNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
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
        provider: input.usage.provider,
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
