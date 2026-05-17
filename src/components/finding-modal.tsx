"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ExternalLink, X } from "lucide-react";
import { FALLACY_BY_ID } from "@/lib/fallacies";
import type { Finding } from "@/lib/schema";
import { useI18n } from "@/lib/i18n/provider";

type Props = {
  finding: Finding | null;
  onClose: () => void;
};

export function FindingModal({ finding, onClose }: Props) {
  const { t, lang } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (finding && !dialog.open) dialog.showModal();
    else if (!finding && dialog.open) dialog.close();
  }, [finding]);

  function onDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) onClose();
  }

  const def = finding ? FALLACY_BY_ID[finding.fallacy] : null;
  const color = def?.color ?? "currentColor";

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={onDialogClick}
      className="m-auto bg-transparent p-0 border-0 outline-none backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      {def && finding && (
        <div className="bg-paper text-foreground border border-rule rounded-lg shadow-2xl max-w-xl w-[92vw] max-h-[85vh] overflow-y-auto">
          <header className="flex items-start gap-3 p-5 sm:p-6 pb-3 border-b border-rule sticky top-0 bg-paper">
            <span
              className="inline-block h-3 w-3 rounded-full mt-2 shrink-0"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <h2 className="font-serif text-xl sm:text-2xl leading-tight">
                {def.name[lang]}
              </h2>
              <span
                className="self-start px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap border"
                style={{
                  color,
                  borderColor: `color-mix(in oklab, ${color} 40%, transparent)`,
                  backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`,
                }}
              >
                {finding.severity === "high" ? t.severity_high : t.severity_low}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.close}
              className="text-muted hover:text-foreground transition-colors p-1 -mr-1 shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="p-5 sm:p-6 flex flex-col gap-5">
            <section className="flex flex-col gap-2">
              <h3 className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                {t.finding_from_text}
              </h3>
              <blockquote
                className="text-sm italic text-muted border-l-2 pl-3"
                style={{ borderColor: color }}
              >
                “{finding.quote}”
              </blockquote>
              <p className="text-sm leading-relaxed">{finding.explanation}</p>
            </section>

            <section className="flex flex-col gap-2 pt-3 border-t border-rule">
              <h3 className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                {t.finding_about_this_fallacy}
              </h3>
              <p className="text-sm leading-relaxed text-foreground/85">
                {def.description[lang]}
              </p>
              <blockquote className="text-sm italic text-muted border-l-2 border-rule pl-3 mt-1">
                <span className="not-italic text-[10px] uppercase tracking-wide block mb-1">
                  {t.guide_example}
                </span>
                {def.example[lang]}
              </blockquote>
            </section>
          </div>

          <footer className="px-5 sm:px-6 py-3 border-t border-rule">
            <Link
              href={`/fallacies#${def.id}`}
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
