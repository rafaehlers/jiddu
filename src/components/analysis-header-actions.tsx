"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";

export function AnalysisHeaderActions() {
  const { t } = useI18n();
  return (
    <Link
      href="/"
      className="text-sm px-3 py-1.5 rounded-md border border-rule hover:border-foreground transition-colors"
    >
      {t.new_analysis}
    </Link>
  );
}
