import "server-only";

import { withAuth } from "@workos-inc/authkit-nextjs";
import { isWorkOSConfigured } from "@/lib/auth-config";

export async function canEmailOwnedReport(
  ownerWorkosUserId: string | null,
): Promise<boolean> {
  if (!ownerWorkosUserId || !isWorkOSConfigured()) return false;
  const { user } = await withAuth();
  return Boolean(
    user?.emailVerified && user.id === ownerWorkosUserId,
  );
}
