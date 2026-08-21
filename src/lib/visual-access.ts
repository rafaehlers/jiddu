import type { User } from "@workos-inc/node";
import { identityMatchesAllowlist } from "@/lib/access-policy";

type AuthIdentity = Pick<User, "email" | "emailVerified">;

export const VISUAL_OWNER_EMAIL = "rafaehlers@gmail.com";

export function isVisualOwnerIdentity(
  user: AuthIdentity | null | undefined,
): boolean {
  return identityMatchesAllowlist(user, [VISUAL_OWNER_EMAIL]);
}
