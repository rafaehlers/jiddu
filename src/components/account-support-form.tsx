"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendAccountSupportAction } from "@/app/account/support/actions";
import {
  INITIAL_EMAIL_FORM_STATE,
  type EmailFormErrorCode,
} from "@/lib/email-form-state";

const ERRORS: Record<EmailFormErrorCode, string> = {
  auth_required: "Your session expired. Sign in and try again.",
  email_unverified: "Verify your account email before contacting support.",
  rate_limit: "Too many messages were sent recently. Try again later.",
  send_failed: "We could not send your message. Try again shortly.",
  validation:
    "Use a subject of at least 3 characters and a message of at least 10 characters.",
};

export function AccountSupportForm({ email }: { email: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    sendAccountSupportAction,
    INITIAL_EMAIL_FORM_STATE,
  );

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <section className="flex max-w-3xl flex-col gap-6">
      <div>
        <h2 className="font-serif text-2xl mb-2">Support</h2>
        <p className="text-sm text-muted">
          Send a message to Jiddu Support. We will reply to {email}.
        </p>
      </div>

      <form
        ref={formRef}
        action={formAction}
        className="flex flex-col gap-5 rounded-lg border border-rule bg-paper p-5 sm:p-6"
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Subject</span>
          <input
            type="text"
            name="subject"
            required
            minLength={3}
            maxLength={160}
            placeholder="How can we help?"
            className={inputClassName}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Message</span>
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={5000}
            rows={8}
            placeholder="Describe your question or problem."
            className={`${inputClassName} resize-y`}
          />
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
              ? "Message sent to Jiddu Support."
              : ERRORS[state.code]}
          </p>
        )}

        <div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-accent px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send message"}
          </button>
        </div>
      </form>
    </section>
  );
}

const inputClassName =
  "w-full rounded-md border border-rule bg-background px-3 py-2.5 outline-none transition-colors focus:border-accent";
