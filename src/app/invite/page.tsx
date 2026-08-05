import type { Metadata } from "next";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { cookies } from "next/headers";
import Link from "next/link";
import {
  acceptInvitationAction,
  switchInvitationAccountAction,
} from "./actions";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isWorkOSConfigured } from "@/lib/auth-config";
import {
  getInvitationClaim,
  INVITATION_COOKIE,
  maskInvitationEmail,
  normalizeInvitationEmail,
  type InvitationClaim,
} from "@/lib/invitations";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invitation · Jiddu",
  robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  accept_failed: "We could not accept this invitation. Try again shortly.",
  already_accepted: "This invitation has already been accepted.",
  already_rewarded: "This account has already received an invitation bonus.",
  expired: "This invitation has expired.",
  invalid: "This invitation link is invalid.",
  not_ready: "This invitation email is still being processed. Try again shortly.",
  wrong_email: "Sign in with the verified email address that received the invitation.",
};

export default async function InvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  const configured = isWorkOSConfigured();
  const auth = configured ? await withAuth() : { user: null };
  const cookieStore = await cookies();
  const token = cookieStore.get(INVITATION_COOKIE)?.value;
  const invitation = token ? await getInvitationClaim(token) : null;
  const errorMessage = query.error
    ? ERROR_MESSAGES[query.error] ?? ERROR_MESSAGES.accept_failed
    : null;

  return (
    <>
      <SiteHeader variant="guide" />
      <main className="mx-auto flex w-full max-w-2xl flex-1 items-center px-4 py-12 sm:px-6">
        <section className="w-full rounded-lg border border-rule bg-paper p-6 sm:p-8">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Jiddu invitation
          </p>
          <InvitationContent
            configured={configured}
            errorMessage={errorMessage}
            invitation={invitation}
            user={auth.user}
          />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function InvitationContent({
  configured,
  errorMessage,
  invitation,
  user,
}: {
  configured: boolean;
  errorMessage: string | null;
  invitation: InvitationClaim | null;
  user: { email: string; emailVerified: boolean; id: string } | null;
}) {
  if (!configured) {
    return (
      <>
        <h1 className="font-serif text-3xl">Invitations are unavailable</h1>
        <p className="mt-3 text-muted">
          Authentication is not configured in this environment.
        </p>
      </>
    );
  }
  if (!invitation) {
    return (
      <>
        <h1 className="font-serif text-3xl">Invitation not found</h1>
        <p className="mt-3 text-muted">
          {errorMessage ?? "Open the original invitation link and try again."}
        </p>
        <p className="mt-6 text-sm">
          <Link href="/">Return to Jiddu</Link>
        </p>
      </>
    );
  }

  const expired = invitation.expired;
  const accepted = Boolean(invitation.acceptedAt);
  const emailMatches = user
    ? normalizeInvitationEmail(user.email) ===
      normalizeInvitationEmail(invitation.inviteeEmail)
    : false;
  const eligible =
    user &&
    user.emailVerified &&
    emailMatches &&
    !accepted &&
    !expired &&
    invitation.deliveryStatus === "sent";

  return (
    <>
      <h1 className="font-serif text-3xl sm:text-4xl">
        You have been invited to Jiddu
      </h1>
      <p className="mt-4 text-foreground/85">
        {invitation.inviterName || "A Jiddu member"} invited {" "}
        {maskInvitationEmail(invitation.inviteeEmail)} to join Jiddu.
      </p>
      <p className="mt-3 text-foreground/85">
        Accept with the invited email address to receive{" "}
        <strong>{invitation.rewardCredits} Jiddu Credits</strong>.
      </p>

      {(errorMessage || expired || accepted) && (
        <div
          role="alert"
          className="mt-6 rounded-md border border-rule bg-background px-4 py-3 text-sm text-muted"
        >
          {errorMessage ??
            (expired
              ? "This invitation has expired."
              : "This invitation has already been accepted.")}
        </div>
      )}

      {!user && !expired && !accepted && (
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/signup?returnTo=/invite"
            className="rounded-md bg-accent px-5 py-2.5 font-medium text-white hover:opacity-90"
          >
            Create account
          </Link>
          <Link
            href="/login?returnTo=/invite"
            className="rounded-md border border-rule px-5 py-2.5 font-medium"
          >
            Sign in
          </Link>
        </div>
      )}

      {user && !emailMatches && !expired && !accepted && (
        <div className="mt-6 rounded-md border border-rule bg-background px-4 py-3 text-sm text-muted">
          <p>
            You are signed in as {user.email}. Sign in with the email address
            that received this invitation.
          </p>
          <form action={switchInvitationAccountAction} className="mt-3">
            <button type="submit" className="font-medium text-foreground underline">
              Use another account
            </button>
          </form>
        </div>
      )}

      {user && emailMatches && !user.emailVerified && !expired && !accepted && (
        <p className="mt-6 rounded-md border border-rule bg-background px-4 py-3 text-sm text-muted">
          Verify {user.email} before accepting this invitation.
        </p>
      )}

      {invitation.deliveryStatus !== "sent" && !expired && !accepted && (
        <p className="mt-6 rounded-md border border-rule bg-background px-4 py-3 text-sm text-muted">
          This invitation is still being processed. Try again shortly.
        </p>
      )}

      {eligible && (
        <form action={acceptInvitationAction} className="mt-7">
          <button
            type="submit"
            className="rounded-md bg-accent px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90"
          >
            Accept invitation
          </button>
        </form>
      )}
    </>
  );
}
