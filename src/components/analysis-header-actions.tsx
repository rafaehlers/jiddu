"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

export function AnalysisHeaderActions() {
  const { t } = useI18n();
  return (
    <Link
      href="/"
      aria-label={t.new_analysis}
      title={t.new_analysis}
      className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border border-rule text-muted hover:text-foreground hover:border-foreground transition-colors"
    >
      <Plus className="h-4 w-4 sm:hidden" />
      <span className="hidden sm:inline">{t.new_analysis}</span>
    </Link>
  );
}
