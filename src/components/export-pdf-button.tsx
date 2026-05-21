"use client";

import { Printer } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

// Small header-bar button that opens the print-friendly version of the
// current analysis or fact-check in a new tab. That route auto-triggers
// the browser print dialog so the user can "Save as PDF" (or print to
// paper) without us shipping a server-side PDF renderer.
export function ExportPdfButton({ href }: { href: string }) {
  const { t } = useI18n();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={t.export_pdf}
      aria-label={t.export_pdf}
      className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border border-rule text-muted hover:text-foreground hover:border-foreground transition-colors"
    >
      <Printer className="h-4 w-4 sm:hidden" />
      <span className="hidden sm:inline">{t.export_pdf}</span>
    </a>
  );
}
