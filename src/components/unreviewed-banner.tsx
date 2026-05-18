"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

// Shown above every analysis/fact-check viewer when the row has no
// reviewedAt timestamp. Permanent (not dismissible) by design — the
// disclaimer is the price for keeping the URLs publicly shareable.
export function UnreviewedBanner() {
  const { t } = useI18n();
  return (
    <div
      role="status"
      className="bg-[color-mix(in_oklab,var(--severity-low)_15%,transparent)] border-b border-[var(--severity-low)]/40"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-start gap-3 text-sm">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[var(--severity-low)]" />
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <p className="font-medium">{t.unreviewed_banner_title}</p>
            <p className="text-muted text-xs leading-snug">
              {t.unreviewed_banner_body}
            </p>
          </div>
          <Link
            href="/legal"
            className="text-xs underline decoration-rule hover:decoration-foreground transition-colors whitespace-nowrap"
          >
            {t.unreviewed_banner_link} →
          </Link>
        </div>
      </div>
    </div>
  );
}
