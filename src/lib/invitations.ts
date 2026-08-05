import "server-only";

import { randomBytes } from "node:crypto";
import type { Lang } from "@/lib/fallacies";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import {
  hashInvitationToken,
  invitationAvailability,
  invitationTokenIsValid,
  normalizeInvitationEmail,
} from "@/lib/invitation-policy";

export {
  hashInvitationToken,
  invitationAvailability,
  invitationTokenIsValid,
  maskInvitationEmail,
  normalizeInvitationEmail,
} from "@/lib/invitation-policy";

export const INVITATION_COOKIE = "jiddu_invitation";
export const INVITATION_EXPIRY_DAYS = 30;

const COUNTED_DELIVERY_STATUSES = ["queued", "sent"];
const QUEUED_RETRY_AFTER_MS = 15 * 60 * 1000;
const SERIALIZABLE_ATTEMPTS = 3;

export type InvitationErrorCode =
  | "already_accepted"
  | "already_invited"
  | "already_rewarded"
  | "expired"
  | "global_limit"
  | "invalid"
  | "not_ready"
  | "per_user_limit"
  | "program_disabled"
  | "wrong_email";

export class InvitationError extends Error {
  constructor(public readonly code: InvitationErrorCode) {
    super(code);
    this.name = "InvitationError";
  }
}

export type InvitationRow = {
  createdAt: string;
  email: string;
  expiresAt: string;
  id: string;
  rewardCredits: number;
  status: "accepted" | "expired" | "failed" | "pending" | "sending";
};

export type InvitationAccountOverview = {
  enabled: boolean;
  globalRemaining: number;
  perUserLimit: number;
  remaining: number;
  rewardCredits: number;
  rows: InvitationRow[];
  used: number;
};

export type InvitationClaim = {
  acceptedAt: Date | null;
  acceptedByWorkosUserId: string | null;
  deliveryStatus: string;
  expiresAt: Date;
  expired: boolean;
  id: string;
  inviteeEmail: string;
  inviterName: string | null;
  locale: Lang;
  rewardCredits: number;
};

export async function prepareInvitation(input: {
  globalLimit: number;
  inviteeEmail: string;
  inviterEmail: string;
  inviterName?: string;
  inviterWorkosUserId: string;
  locale: Lang;
  message?: string;
  perUserLimit: number;
  rewardCredits: number;
}): Promise<{
  id: string;
  token: string;
  expiresAt: Date;
  rewardCredits: number;
}> {
  const globalLimit = nonNegativeSafeInteger(input.globalLimit);
  const perUserLimit = nonNegativeSafeInteger(input.perUserLimit);
  const rewardCredits = nonNegativeSafeInteger(input.rewardCredits);
  if (globalLimit < 1 || perUserLimit < 1 || rewardCredits < 1) {
    throw new InvitationError("program_disabled");
  }

  const inviteeEmail = normalizeInvitationEmail(input.inviteeEmail);
  const inviterEmail = normalizeInvitationEmail(input.inviterEmail);
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashInvitationToken(token);
  const expiresAt = new Date(
    Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );

  try {
    const invitation = await serializableTransaction(async (tx) => {
      const existing = await tx.invitation.findUnique({
        where: { inviteeEmail },
        select: {
          id: true,
          deliveryStatus: true,
          inviterWorkosUserId: true,
          updatedAt: true,
        },
      });
      const staleQueued =
        existing?.deliveryStatus === "queued" &&
        existing.updatedAt.getTime() <= Date.now() - QUEUED_RETRY_AFTER_MS;
      if (
        existing &&
        ((existing.deliveryStatus !== "failed" && !staleQueued) ||
          existing.inviterWorkosUserId !== input.inviterWorkosUserId)
      ) {
        throw new InvitationError("already_invited");
      }
      const replacingCountedInvitation = staleQueued ? 1 : 0;

      const globalUsed = await tx.invitation.count({
        where: { deliveryStatus: { in: COUNTED_DELIVERY_STATUSES } },
      });
      if (globalUsed - replacingCountedInvitation >= globalLimit) {
        throw new InvitationError("global_limit");
      }

      const userUsed = await tx.invitation.count({
        where: {
          inviterWorkosUserId: input.inviterWorkosUserId,
          deliveryStatus: { in: COUNTED_DELIVERY_STATUSES },
        },
      });
      if (userUsed - replacingCountedInvitation >= perUserLimit) {
        throw new InvitationError("per_user_limit");
      }

      const data = {
        deliveryStatus: "queued",
        expiresAt,
        inviterEmail,
        inviterName: input.inviterName?.trim().slice(0, 160) || null,
        inviterWorkosUserId: input.inviterWorkosUserId,
        lastDeliveryError: null,
        locale: input.locale,
        message: input.message?.trim().slice(0, 500) || null,
        resendEmailId: null,
        rewardCredits,
        sentAt: null,
        tokenHash,
      } as const;

      if (existing) {
        return tx.invitation.update({
          where: { id: existing.id },
          data,
          select: { id: true },
        });
      }
      return tx.invitation.create({
        data: { ...data, inviteeEmail },
        select: { id: true },
      });
    });
    return { id: invitation.id, token, expiresAt, rewardCredits };
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw new InvitationError("already_invited");
    }
    throw error;
  }
}

export async function markInvitationDelivered(
  id: string,
  resendEmailId: string,
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < SERIALIZABLE_ATTEMPTS; attempt += 1) {
    try {
      const updated = await prisma.invitation.updateMany({
        where: { id, deliveryStatus: "queued" },
        data: {
          deliveryStatus: "sent",
          lastDeliveryError: null,
          resendEmailId,
          sentAt: new Date(),
        },
      });
      if (updated.count === 1) return;
      const current = await prisma.invitation.findUnique({
        where: { id },
        select: { deliveryStatus: true, resendEmailId: true },
      });
      if (
        current?.deliveryStatus === "sent" &&
        current.resendEmailId === resendEmailId
      ) {
        return;
      }
      throw new Error("Invitation is no longer queued for delivery.");
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export async function markInvitationDeliveryFailed(
  id: string,
  error: unknown,
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  await prisma.invitation.updateMany({
    where: { id, deliveryStatus: "queued" },
    data: {
      deliveryStatus: "failed",
      lastDeliveryError: message.slice(0, 500),
    },
  });
}

export async function getInvitationAccountOverview(input: {
  globalLimit: number;
  perUserLimit: number;
  rewardCredits: number;
  workosUserId: string;
}): Promise<InvitationAccountOverview> {
  const [globalUsed, userUsed, invitations] = await Promise.all([
    prisma.invitation.count({
      where: { deliveryStatus: { in: COUNTED_DELIVERY_STATUSES } },
    }),
    prisma.invitation.count({
      where: {
        inviterWorkosUserId: input.workosUserId,
        deliveryStatus: { in: COUNTED_DELIVERY_STATUSES },
      },
    }),
    prisma.invitation.findMany({
      where: { inviterWorkosUserId: input.workosUserId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        acceptedAt: true,
        createdAt: true,
        deliveryStatus: true,
        expiresAt: true,
        id: true,
        inviteeEmail: true,
        rewardCredits: true,
      },
    }),
  ]);
  const perUserLimit = nonNegativeSafeInteger(input.perUserLimit);
  const rewardCredits = nonNegativeSafeInteger(input.rewardCredits);
  const availability = invitationAvailability({
    globalLimit: input.globalLimit,
    globalUsed,
    perUserLimit,
    rewardCredits,
    userUsed,
  });

  return {
    enabled: availability.enabled,
    globalRemaining: availability.globalRemaining,
    perUserLimit,
    remaining: availability.remaining,
    rewardCredits,
    rows: invitations.map((invitation) => ({
      createdAt: invitation.createdAt.toISOString(),
      email: invitation.inviteeEmail,
      expiresAt: invitation.expiresAt.toISOString(),
      id: invitation.id,
      rewardCredits: invitation.rewardCredits,
      status: invitationDisplayStatus(invitation),
    })),
    used: userUsed,
  };
}

export async function getInvitationAdminStats(): Promise<{
  accepted: number;
  failed: number;
  total: number;
}> {
  const [accepted, failed, total] = await Promise.all([
    prisma.invitation.count({ where: { acceptedAt: { not: null } } }),
    prisma.invitation.count({ where: { deliveryStatus: "failed" } }),
    prisma.invitation.count({
      where: { deliveryStatus: { in: COUNTED_DELIVERY_STATUSES } },
    }),
  ]);
  return { accepted, failed, total };
}

export async function getInvitationClaim(
  rawToken: string,
): Promise<InvitationClaim | null> {
  if (!invitationTokenIsValid(rawToken)) return null;
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: hashInvitationToken(rawToken) },
    select: {
      acceptedAt: true,
      acceptedByWorkosUserId: true,
      deliveryStatus: true,
      expiresAt: true,
      id: true,
      inviteeEmail: true,
      inviterName: true,
      locale: true,
      rewardCredits: true,
    },
  });
  if (!invitation) return null;
  return {
    ...invitation,
    expired: invitation.expiresAt.getTime() <= Date.now(),
    locale: invitationLocale(invitation.locale),
  };
}

export async function acceptInvitation(input: {
  email: string;
  emailVerified: boolean;
  rawToken: string;
  workosUserId: string;
}): Promise<{ alreadyAccepted: boolean; credits: number }> {
  if (!input.emailVerified) throw new InvitationError("wrong_email");
  if (!invitationTokenIsValid(input.rawToken)) {
    throw new InvitationError("invalid");
  }
  const tokenHash = hashInvitationToken(input.rawToken);
  const email = normalizeInvitationEmail(input.email);

  try {
    return await serializableTransaction(async (tx) => {
      const invitation = await tx.invitation.findUnique({
        where: { tokenHash },
      });
      if (!invitation) throw new InvitationError("invalid");
      if (invitation.acceptedAt) {
        if (invitation.acceptedByWorkosUserId === input.workosUserId) {
          return {
            alreadyAccepted: true,
            credits: invitation.rewardCredits,
          };
        }
        throw new InvitationError("already_accepted");
      }
      if (invitation.deliveryStatus !== "sent") {
        throw new InvitationError("not_ready");
      }
      if (invitation.expiresAt.getTime() <= Date.now()) {
        throw new InvitationError("expired");
      }
      if (normalizeInvitationEmail(invitation.inviteeEmail) !== email) {
        throw new InvitationError("wrong_email");
      }

      const claimed = await tx.invitation.updateMany({
        where: {
          acceptedAt: null,
          deliveryStatus: "sent",
          expiresAt: { gt: new Date() },
          id: invitation.id,
        },
        data: {
          acceptedAt: new Date(),
          acceptedByWorkosUserId: input.workosUserId,
        },
      });
      if (claimed.count !== 1) throw new InvitationError("already_accepted");

      const account = await tx.jidduCreditAccount.upsert({
        where: { workosUserId: input.workosUserId },
        create: {
          email,
          workosUserId: input.workosUserId,
        },
        update: { email },
      });
      const updated = await tx.jidduCreditAccount.update({
        where: { workosUserId: account.workosUserId },
        data: { balance: { increment: invitation.rewardCredits } },
      });
      const transaction = await tx.jidduCreditTransaction.create({
        data: {
          amount: invitation.rewardCredits,
          balanceAfter: updated.balance,
          kind: "invite_bonus",
          metadata: JSON.stringify({ source: "invitation" }),
          note: "Invitation accepted",
          resourceId: invitation.id,
          workosUserId: input.workosUserId,
        },
        select: { id: true },
      });
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { rewardTransactionId: transaction.id },
      });

      return { alreadyAccepted: false, credits: invitation.rewardCredits };
    });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      throw new InvitationError("already_rewarded");
    }
    throw error;
  }
}

function invitationDisplayStatus(input: {
  acceptedAt: Date | null;
  deliveryStatus: string;
  expiresAt: Date;
}): InvitationRow["status"] {
  if (input.acceptedAt) return "accepted";
  if (input.deliveryStatus === "failed") return "failed";
  if (input.deliveryStatus === "queued") return "sending";
  if (input.expiresAt.getTime() <= Date.now()) return "expired";
  return "pending";
}

function invitationLocale(value: string): Lang {
  return value === "pt" || value === "es" ? value : "en";
}

function nonNegativeSafeInteger(value: number): number {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

async function serializableTransaction<T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < SERIALIZABLE_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(work, {
        isolationLevel: "Serializable",
      });
    } catch (error) {
      lastError = error;
      if (!isPrismaError(error, "P2034")) throw error;
    }
  }
  throw lastError;
}

function isPrismaError(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}
