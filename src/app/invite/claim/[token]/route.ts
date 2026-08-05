import { NextResponse } from "next/server";
import { appBaseUrl } from "@/lib/auth-config";
import {
  getInvitationClaim,
  INVITATION_COOKIE,
} from "@/lib/invitations";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const invitation = await getInvitationClaim(token);
  const destination = new URL("/invite", appBaseUrl(request.url));
  if (!invitation) {
    destination.searchParams.set("error", "invalid");
    const response = NextResponse.redirect(destination);
    response.cookies.set(INVITATION_COOKIE, "", {
      httpOnly: true,
      maxAge: 0,
      path: "/invite",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  }

  const response = NextResponse.redirect(destination);
  response.cookies.set(INVITATION_COOKIE, token, {
    httpOnly: true,
    maxAge: Math.max(
      60,
      Math.floor((invitation.expiresAt.getTime() - Date.now()) / 1000),
    ),
    path: "/invite",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
