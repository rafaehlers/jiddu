"use client";

import { useI18n } from "@/lib/i18n/provider";
import type { LiveLens } from "@/lib/live-lenses";

const STYLE: Record<LiveLens, string> = {
  context: "border-indigo-500/40 bg-indigo-500/10 text-indigo-500",
  fallacy: "border-amber-500/40 bg-amber-500/10 text-amber-600",
  factcheck: "border-blue-500/40 bg-blue-500/10 text-blue-500",
  neutrality: "border-purple-500/40 bg-purple-500/10 text-purple-500",
};

export function LiveResultTypeBadge({ lens }: { lens: LiveLens }) {
  const { t } = useI18n();
  const label =
    lens === "context"
      ? t.live_lens_context
      : lens === "fallacy"
      ? t.live_lens_fallacy
      : lens === "factcheck"
        ? t.live_lens_factcheck
        : t.live_lens_neutrality;

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STYLE[lens]}`}
    >
      {label}
    </span>
  );
}
