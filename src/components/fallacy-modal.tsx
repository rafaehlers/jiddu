"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { X, ExternalLink } from "lucide-react";
import { CATEGORY_LABELS, FALLACY_BY_ID } from "@/lib/fallacies";
import { useI18n } from "@/lib/i18n/provider";

type Props = {
  fallacyId: string | null;
  onClose: () => void;
};

export function FallacyModal({ fallacyId, onClose }: Props) {
  const { t, lang } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (fallacyId && !dialog.open) {
      dialog.showModal();
    } else if (!fallacyId && dialog.open) {
      dialog.close();
    }
  }, [fallacyId]);

  // Close on backdrop click (clicks outside the inner content).
  function onDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) onClose();
  }

  const f = fallacyId ? FALLACY_BY_ID[fallacyId] : null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={onDialogClick}
      className="m-auto bg-transparent p-0 border-0 outline-none backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      {f && (
        <div className="bg-paper text-foreground border border-rule rounded-lg shadow-2xl max-w-2xl w-[90vw] max-h-[85vh] overflow-y-auto">
          <header className="flex items-start gap-3 p-6 pb-3 border-b border-rule sticky top-0 bg-paper">
            <span
              className="inline-block h-3 w-3 rounded-full mt-2 shrink-0"
              style={{ backgroundColor: f.color }}
              aria-hidden
            />
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-2xl leading-tight">{f.name[lang]}</h2>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">
                {t.category} · {CATEGORY_LABELS[f.category][lang]}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.close}
              className="text-muted hover:text-foreground transition-colors p-1 -mr-1"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="p-6 flex flex-col gap-4">
            <p className="text-foreground/90 leading-relaxed">{f.description[lang]}</p>
            <blockquote className="border-l-2 pl-4 text-muted italic" style={{ borderColor: f.color }}>
              <span className="text-xs not-italic uppercase tracking-wide block mb-1 text-muted">
                {t.guide_example}
              </span>
              {f.example[lang]}
            </blockquote>
          </div>
          <footer className="px-6 py-4 border-t border-rule">
            <Link
              href={`/fallacies#${f.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              {t.open_in_guide}
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </footer>
        </div>
      )}
    </dialog>
  );
}
