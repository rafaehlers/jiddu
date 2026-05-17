"use client";

import { useEffect, useRef } from "react";
import { MousePointerClick } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function MobileHintModal({ open, onClose }: Props) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  function onDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={onDialogClick}
      className="m-auto bg-transparent p-0 border-0 outline-none backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="bg-paper text-foreground border border-rule rounded-lg shadow-2xl max-w-sm w-[88vw] p-6 flex flex-col items-center gap-4 text-center">
        <div
          className="inline-flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            backgroundColor: "color-mix(in oklab, var(--accent) 18%, transparent)",
            color: "var(--accent)",
          }}
          aria-hidden
        >
          <MousePointerClick className="h-6 w-6" />
        </div>
        <h2 className="font-serif text-xl leading-tight">{t.mobile_hint_title}</h2>
        <p className="text-sm text-muted leading-relaxed">{t.mobile_hint_body}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 px-5 py-2 rounded-md bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
        >
          {t.mobile_hint_dismiss}
        </button>
      </div>
    </dialog>
  );
}
