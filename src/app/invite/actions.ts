"use server";

import { signOut, withAuth } from "@workos-inc/authkit-nextjs";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { appBaseUrl } from "@/lib/auth-config";
import {
  acceptInvitation,
  InvitationError,
  INVITATION_COOKIE,
} from "@/lib/invitations";

export async function acceptInvitationAction(): Promise<void> {
  const { user } = await withAuth();
  if (!user) redirect("/login?returnTo=/invite");

  const cookieStore = await cookies();
  const rawToken = cookieStore.get(INVITATION_COOKIE)?.value;
  if (!rawToken) redirect("/invite?error=invalid");

  try {
    await acceptInvitation({
      email: user.email,
      emailVerified: user.emailVerified,
      rawToken,
      workosUserId: user.id,
    });
  } catch (error) {
    if (error instanceof InvitationError) {
      redirect(`/invite?error=${error.code}`);
    }
    console.error("Could not accept invitation:", error);
    redirect("/invite?error=accept_failed");
  }

  cookieStore.set(INVITATION_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/invite",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  revalidatePath("/account");
  redirect("/account?tab=credits&inviteAccepted=1");
}

export async function switchInvitationAccountAction(): Promise<void> {
  await signOut({ returnTo: `${appBaseUrl()}/invite` });
}
