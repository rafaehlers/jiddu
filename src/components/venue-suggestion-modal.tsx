"use client";

import { useActionState, useEffect, useRef } from "react";
import { BookOpenText, CheckCircle2, X } from "lucide-react";
import { sendVenueSuggestionAction } from "@/app/review/actions";
import {
  INITIAL_EMAIL_FORM_STATE,
  type EmailFormErrorCode,
} from "@/lib/email-form-state";
import type { Messages } from "@/lib/i18n/messages";
import { useI18n } from "@/lib/i18n/provider";

type Props = {
  initialName: string;
  onClose: () => void;
};

const inputClassName =
  "w-full rounded-md border border-rule bg-background px-3 py-2 outline-none focus:border-accent";

export function VenueSuggestionModal({ initialName, onClose }: Props) {
  const { t, lang } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(
    sendVenueSuggestionAction,
    INITIAL_EMAIL_FORM_STATE,
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  function onDialogClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) onClose();
  }

  const submitted = state.status === "success";

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={onDialogClick}
      aria-labelledby="venue-suggestion-title"
      aria-describedby="venue-suggestion-description"
      className="m-auto border-0 bg-transparent p-0 outline-none backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="relative flex w-[92vw] max-w-lg flex-col gap-5 rounded-lg border border-rule bg-paper p-6 text-foreground shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="absolute right-3 top-3 p-1 text-muted transition-colors hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-start gap-4 pr-7">
          <span
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_18%,transparent)] text-accent-hi"
            aria-hidden
          >
            {submitted ? (
              <CheckCircle2 className="size-5" />
            ) : (
              <BookOpenText className="size-5" />
            )}
          </span>
          <div className="flex flex-col gap-1.5">
            <h2 id="venue-suggestion-title" className="font-serif text-2xl">
              {t.review_venue_suggest_title}
            </h2>
            <p
              id="venue-suggestion-description"
              className="text-sm leading-relaxed text-muted"
            >
              {submitted
                ? t.review_venue_suggest_success
                : t.review_venue_suggest_description}
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              {t.close}
            </button>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="lang" value={lang} />
            <div hidden>
              <label>
                Company
                <input name="company" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-wide text-muted">
                {t.review_venue_suggest_name}
              </span>
              <input
                type="text"
                name="name"
                required
                minLength={2}
                maxLength={160}
                defaultValue={initialName}
                autoFocus
                placeholder={t.review_venue_suggest_name_placeholder}
                className={inputClassName}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-wide text-muted">
                {t.review_venue_suggest_url}
              </span>
              <input
                type="url"
                name="url"
                maxLength={2048}
                inputMode="url"
                autoComplete="url"
                placeholder={t.review_venue_suggest_url_placeholder}
                className={inputClassName}
              />
            </label>

            {state.status === "error" && (
              <p
                role="alert"
                aria-live="polite"
                className="rounded-md border border-[var(--severity-high)]/40 px-4 py-3 text-sm text-[var(--severity-high)]"
              >
                {suggestionError(state.code, t)}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={pending}
                className="rounded-md border border-rule px-5 py-2 text-sm font-medium transition-colors hover:border-foreground/50 disabled:opacity-60"
              >
                {t.review_venue_suggest_cancel}
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
              >
                {pending
                  ? t.review_venue_suggest_sending
                  : t.review_venue_suggest_submit}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}

function suggestionError(code: EmailFormErrorCode, t: Messages): string {
  if (code === "validation") return t.review_venue_suggest_error_validation;
  if (code === "rate_limit") return t.review_venue_suggest_error_rate_limit;
  return t.review_venue_suggest_error_send;
}
