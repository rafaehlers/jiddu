import "server-only";

import { withAuth } from "@workos-inc/authkit-nextjs";
import type { User } from "@workos-inc/node";
import { notFound, redirect } from "next/navigation";
import {
  identityMatchesAllowlist,
  parseEmailAllowlist,
} from "@/lib/access-policy";

type AuthIdentity = Pick<User, "email" | "emailVerified">;

export function configuredAdminEmails(): string[] {
  return parseEmailAllowlist(process.env.ADMIN_EMAILS);
}

export function isAdminIdentity(
  user: AuthIdentity | null | undefined,
): boolean {
  return identityMatchesAllowlist(user, configuredAdminEmails());
}

export async function requireAdminPage(): Promise<User> {
  const { user } = await withAuth();
  if (!user) redirect("/login?returnTo=/admin");
  if (!isAdminIdentity(user)) notFound();
  return user;
}

export async function assertAdminUser(): Promise<User> {
  const { user } = await withAuth();
  if (!user || !isAdminIdentity(user)) {
    throw new Error("Forbidden");
  }
  return user;
}
