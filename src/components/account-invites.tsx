"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  sendInvitationAction,
} from "@/app/account/invites/actions";
import {
  INITIAL_INVITATION_FORM_STATE,
  type InvitationFormErrorCode,
} from "@/lib/invitation-form-state";
import type { InvitationAccountOverview } from "@/lib/invitations";

const ERRORS: Record<InvitationFormErrorCode, string> = {
  already_invited: "This email address has already been invited.",
  auth_required: "Your session expired. Sign in and try again.",
  email_unverified: "Verify your account email before sending invitations.",
  existing_account: "This email address already belongs to a Jiddu account.",
  global_limit: "The global invitation limit has been reached.",
  per_user_limit: "You have used all of your invitations.",
  program_disabled: "Invitations are not available right now.",
  rate_limit: "Too many invitation attempts. Try again later.",
  self_invite: "You cannot invite your own email address.",
  send_failed: "We could not send the invitation. Try again shortly.",
  validation: "Enter a valid email and keep the message under 500 characters.",
  workos_lookup_failed:
    "We could not verify this email address. Try again shortly.",
};

const STATUS_LABELS: Record<
  InvitationAccountOverview["rows"][number]["status"],
  string
> = {
  accepted: "Accepted",
  expired: "Expired",
  failed: "Failed",
  pending: "Pending",
  sending: "Sending",
};

export function AccountInvites({
  overview,
}: {
  overview: InvitationAccountOverview;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    sendInvitationAction,
    INITIAL_INVITATION_FORM_STATE,
  );

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  const canInvite = overview.enabled && overview.remaining > 0;

  return (
    <section className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl mb-2">Invites</h2>
          <p className="text-sm text-muted">
            Invite someone to Jiddu. They will receive {overview.rewardCredits}{" "}
            Jiddu Credits after accepting with the invited email address.
          </p>
        </div>
        <div className="rounded-md border border-rule bg-paper px-4 py-2 text-right">
          <p className="text-xl font-medium tabular-nums">
            {overview.remaining}
          </p>
          <p className="text-xs text-muted">invitations available</p>
        </div>
      </div>

      {!overview.enabled && (
        <div className="rounded-md border border-rule bg-paper px-4 py-3 text-sm text-muted">
          The invitation program is not available right now.
        </div>
      )}

      <form
        ref={formRef}
        action={formAction}
        className="flex flex-col gap-5 rounded-lg border border-rule bg-paper p-5 sm:p-6"
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Guest email</span>
          <input
            type="email"
            name="email"
            required
            maxLength={254}
            autoComplete="email"
            placeholder="friend@example.com"
            disabled={!canInvite || pending}
            className={inputClassName}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Personal message</span>
          <textarea
            name="message"
            maxLength={500}
            rows={4}
            placeholder="Add an optional note to the invitation email."
            disabled={!canInvite || pending}
            className={`${inputClassName} resize-y`}
          />
          <span className="text-xs text-muted">Optional · up to 500 characters</span>
        </label>

        {state.status !== "idle" && (
          <p
            role={state.status === "error" ? "alert" : "status"}
            aria-live="polite"
            className={`rounded-md border px-4 py-3 text-sm ${
              state.status === "success"
                ? "border-emerald-600/40 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                : "border-[var(--severity-high)]/40 text-[var(--severity-high)]"
            }`}
          >
            {state.status === "success"
              ? `Invitation sent to ${state.email}.`
              : ERRORS[state.code]}
          </p>
        )}

        <div>
          <button
            type="submit"
            disabled={!canInvite || pending}
            className="rounded-md bg-accent px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send invitation"}
          </button>
        </div>
      </form>

      {overview.rows.length > 0 && (
        <div>
          <h3 className="font-serif text-xl mb-3">Invitation history</h3>
          <div className="overflow-hidden rounded-lg border border-rule bg-paper">
            <ul className="divide-y divide-[var(--rule)]">
              {overview.rows.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{row.email}</p>
                    <p className="text-xs text-muted">
                      Sent {formatDate(row.createdAt)} · {row.rewardCredits}{" "}
                      credits
                    </p>
                  </div>
                  <span className="rounded-full border border-rule px-2.5 py-1 text-xs text-muted">
                    {STATUS_LABELS[row.status]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

const inputClassName =
  "w-full rounded-md border border-rule bg-background px-3 py-2.5 outline-none transition-colors focus:border-accent disabled:cursor-not-allowed disabled:opacity-60";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}
