import "server-only";

import type { User } from "@workos-inc/node";
import { normalizeAccessEmail } from "@/lib/access-policy";
import { isAdminIdentity } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

type AuthIdentity = Pick<User, "email" | "emailVerified">;
export type AnalysisAccessMode = "platform" | "jiddu";

export async function effectiveAnalysisAccessMode(
  user: AuthIdentity | null | undefined,
): Promise<AnalysisAccessMode> {
  if (!user?.emailVerified) return "jiddu";
  if (isAdminIdentity(user)) return "platform";

  const grant = await prisma.platformAccessGrant.findUnique({
    where: { email: normalizeAccessEmail(user.email) },
    select: { id: true },
  });
  return grant ? "platform" : "jiddu";
}
