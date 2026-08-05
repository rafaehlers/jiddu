"use server";

import { withAuth } from "@workos-inc/authkit-nextjs";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { appBaseUrl } from "@/lib/auth-config";
import type { InvitationFormState } from "@/lib/invitation-form-state";
import { sendInvitationEmail } from "@/lib/invitation-email";
import {
  InvitationError,
  markInvitationDelivered,
  markInvitationDeliveryFailed,
  normalizeInvitationEmail,
  prepareInvitation,
} from "@/lib/invitations";
import { consume } from "@/lib/rate-limit";
import { loadSettings } from "@/lib/settings";
import { findWorkOSUserByEmailStrict } from "@/lib/workos-users";

const invitationSchema = z.object({
  email: z.string().trim().email().max(254),
  message: z.string().trim().max(500),
});

export async function sendInvitationAction(
  _previousState: InvitationFormState,
  formData: FormData,
): Promise<InvitationFormState> {
  const { user } = await withAuth();
  if (!user) return { status: "error", code: "auth_required" };
  if (!user.emailVerified) {
    return { status: "error", code: "email_unverified" };
  }

  const parsed = invitationSchema.safeParse({
    email: formData.get("email"),
    message: formData.get("message") ?? "",
  });
  if (!parsed.success) return { status: "error", code: "validation" };

  const inviteeEmail = normalizeInvitationEmail(parsed.data.email);
  if (inviteeEmail === normalizeInvitationEmail(user.email)) {
    return { status: "error", code: "self_invite" };
  }
  const rateLimit = consume(`account-invitation:${user.id}`, {
    capacity: 10,
    refillPerSec: 10 / 3600,
  });
  if (!rateLimit.allowed) {
    return { status: "error", code: "rate_limit" };
  }

  try {
    if (await findWorkOSUserByEmailStrict(inviteeEmail)) {
      return { status: "error", code: "existing_account" };
    }
  } catch (error) {
    console.error("Could not check invited email in WorkOS:", error);
    return { status: "error", code: "workos_lookup_failed" };
  }

  const settings = await loadSettings();
  const cookieStore = await cookies();
  const requestedLocale = cookieStore.get("jiddu_lang")?.value;
  const locale =
    requestedLocale === "pt" || requestedLocale === "es"
      ? requestedLocale
      : "en";
  const inviterName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.email;

  let invitation: Awaited<ReturnType<typeof prepareInvitation>>;
  try {
    invitation = await prepareInvitation({
      globalLimit: settings["invites.globalLimit"],
      inviteeEmail,
      inviterEmail: user.email,
      inviterName,
      inviterWorkosUserId: user.id,
      locale,
      message: parsed.data.message,
      perUserLimit: settings["invites.perUserLimit"],
      rewardCredits: settings["invites.acceptanceCredits"],
    });
  } catch (error) {
    if (error instanceof InvitationError) {
      const code = error.code;
      if (
        code === "already_invited" ||
        code === "global_limit" ||
        code === "per_user_limit" ||
        code === "program_disabled"
      ) {
        return { status: "error", code };
      }
    }
    console.error("Could not prepare invitation:", error);
    return { status: "error", code: "send_failed" };
  }

  let resendEmailId: string;
  try {
    resendEmailId = await sendInvitationEmail({
      acceptUrl: `${appBaseUrl()}/invite/claim/${invitation.token}`,
      expiresAt: invitation.expiresAt,
      invitationId: invitation.id,
      inviteeEmail,
      inviterName,
      locale,
      message: parsed.data.message,
      rewardCredits: invitation.rewardCredits,
    });
  } catch (error) {
    console.error("Could not send invitation email:", error);
    await markInvitationDeliveryFailed(invitation.id, error).catch(
      (updateError) =>
        console.error("Could not record invitation delivery failure:", updateError),
    );
    revalidatePath("/account");
    return { status: "error", code: "send_failed" };
  }

  try {
    await markInvitationDelivered(invitation.id, resendEmailId);
  } catch (error) {
    // The provider accepted the email, so do not mark it failed or rotate its
    // token. Keeping the row queued is safer than invalidating a delivered URL.
    console.error("Could not record invitation delivery:", error);
    revalidatePath("/account");
    return { status: "error", code: "send_failed" };
  }

  revalidatePath("/account");
  return { status: "success", email: inviteeEmail };
}
