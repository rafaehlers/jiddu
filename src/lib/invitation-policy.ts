import { createHash } from "node:crypto";

export function normalizeInvitationEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function invitationTokenIsValid(value: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(value);
}

export function hashInvitationToken(value: string): string {
  return createHash("sha256").update(`jiddu-invitation:${value}`).digest("hex");
}

export function maskInvitationEmail(value: string): string {
  const [local, domain] = normalizeInvitationEmail(value).split("@");
  if (!local || !domain) return "the invited email address";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}

export function invitationAvailability(input: {
  globalLimit: number;
  globalUsed: number;
  perUserLimit: number;
  rewardCredits: number;
  userUsed: number;
}): { enabled: boolean; globalRemaining: number; remaining: number } {
  const globalLimit = nonNegativeSafeInteger(input.globalLimit);
  const globalUsed = nonNegativeSafeInteger(input.globalUsed);
  const perUserLimit = nonNegativeSafeInteger(input.perUserLimit);
  const rewardCredits = nonNegativeSafeInteger(input.rewardCredits);
  const userUsed = nonNegativeSafeInteger(input.userUsed);
  const globalRemaining = Math.max(0, globalLimit - globalUsed);
  const userRemaining = Math.max(0, perUserLimit - userUsed);
  const enabled = globalLimit > 0 && perUserLimit > 0 && rewardCredits > 0;
  return {
    enabled,
    globalRemaining,
    remaining: enabled ? Math.min(globalRemaining, userRemaining) : 0,
  };
}

function nonNegativeSafeInteger(value: number): number {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}
