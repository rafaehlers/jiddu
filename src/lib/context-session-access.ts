import { z } from "zod";

export const CONTEXT_SESSION_TITLE_MAX_LENGTH = 160;

export const ContextSessionTitleRequestSchema = z.object({
  title: z.string().trim().min(1).max(CONTEXT_SESSION_TITLE_MAX_LENGTH),
});

export function canManageContextSession(
  userId: string | null | undefined,
  ownerUserId: string | null | undefined,
) {
  return Boolean(userId && ownerUserId && userId === ownerUserId);
}
