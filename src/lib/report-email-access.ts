import "server-only";

import { withAuth } from "@workos-inc/authkit-nextjs";
import { isWorkOSConfigured } from "@/lib/auth-config";
import { canManageReportTitle } from "@/lib/report-title";

export type OwnedReportAccess = {
  canEditTitle: boolean;
  canEmail: boolean;
};

export async function getOwnedReportAccess(
  ownerWorkosUserId: string | null,
): Promise<OwnedReportAccess> {
  if (!ownerWorkosUserId || !isWorkOSConfigured()) {
    return { canEditTitle: false, canEmail: false };
  }
  const { user } = await withAuth();
  const canEditTitle = canManageReportTitle(user?.id, ownerWorkosUserId);
  return {
    canEditTitle,
    canEmail: canEditTitle && Boolean(user?.emailVerified),
  };
}

export async function canEmailOwnedReport(
  ownerWorkosUserId: string | null,
): Promise<boolean> {
  return (await getOwnedReportAccess(ownerWorkosUserId)).canEmail;
}
