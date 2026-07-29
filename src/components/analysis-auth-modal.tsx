"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { LogIn, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

type Props = {
  open: boolean;
  returnTo: string;
  onClose: () => void;
};

export function AnalysisAuthModal({ open, returnTo, onClose }: Props) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const encodedReturnTo = encodeURIComponent(returnTo);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  function onDialogClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={onDialogClick}
      aria-labelledby="analysis-auth-title"
      aria-describedby="analysis-auth-description"
      className="m-auto border-0 bg-transparent p-0 outline-none backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="relative flex w-[92vw] max-w-md flex-col items-center gap-5 rounded-lg border border-rule bg-paper p-6 text-center text-foreground shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="absolute right-3 top-3 p-1 text-muted transition-colors hover:text-foreground"
        >
          <X className="size-5" />
        </button>
        <span
          className="inline-flex size-12 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_18%,transparent)] text-accent-hi"
          aria-hidden
        >
          <LogIn className="size-6" />
        </span>
        <div className="flex flex-col gap-2">
          <h2 id="analysis-auth-title" className="font-serif text-2xl">
            {t.auth_required_title}
          </h2>
          <p
            id="analysis-auth-description"
            className="text-sm leading-relaxed text-muted"
          >
            {t.auth_required_hint}
          </p>
        </div>
        <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/login?returnTo=${encodedReturnTo}`}
            onClick={onClose}
            className="rounded-md border border-rule px-5 py-2 text-sm font-medium transition-colors hover:border-foreground/50"
          >
            {t.auth_sign_in}
          </Link>
          <Link
            href={`/signup?returnTo=${encodedReturnTo}`}
            onClick={onClose}
            className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            {t.auth_create_account}
          </Link>
        </div>
      </div>
    </dialog>
  );
}
