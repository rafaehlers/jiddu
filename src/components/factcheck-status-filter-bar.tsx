"use client";

import type { Messages } from "@/lib/i18n/messages";
import { useI18n } from "@/lib/i18n/provider";
import {
  FACTCHECK_STATUS_FILTERS,
  type FactCheckStatusFilter,
} from "@/lib/factcheck-status-filter";
import { cn } from "@/lib/utils";

const FILTER_META: Record<
  FactCheckStatusFilter,
  { labelKey: keyof Messages; dotClass: string }
> = {
  all: { labelKey: "fc_filter_all", dotClass: "bg-foreground" },
  supported: {
    labelKey: "fc_filter_supported",
    dotClass: "bg-emerald-500",
  },
  contradicted: {
    labelKey: "fc_filter_contradicted",
    dotClass: "bg-red-500",
  },
  mixed: { labelKey: "fc_filter_mixed", dotClass: "bg-amber-500" },
  unverified: {
    labelKey: "fc_filter_unverified",
    dotClass: "bg-zinc-400",
  },
  pending: { labelKey: "fc_filter_pending", dotClass: "bg-blue-500" },
};

type Props = {
  value: FactCheckStatusFilter;
  counts: Readonly<Record<FactCheckStatusFilter, number>>;
  onChange: (filter: FactCheckStatusFilter) => void;
  className?: string;
};

export function FactCheckStatusFilterBar({
  value,
  counts,
  onChange,
  className,
}: Props) {
  const { t } = useI18n();

  return (
    <div
      className={cn("flex flex-wrap gap-1.5", className)}
      role="group"
      aria-label={t.fc_filter_label}
    >
      {FACTCHECK_STATUS_FILTERS.map((filter) => {
        const meta = FILTER_META[filter];
        const selected = value === filter;
        return (
          <button
            key={filter}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(filter)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              selected
                ? "border-foreground bg-foreground text-background"
                : "border-rule bg-paper text-muted hover:border-foreground/40 hover:text-foreground",
            )}
          >
            <span
              aria-hidden="true"
              className={cn("size-1.5 rounded-full", meta.dotClass)}
            />
            <span>{String(t[meta.labelKey])}</span>
            <span
              className={cn(
                "inline-flex min-w-5 items-center justify-center rounded-full px-1 tabular-nums",
                selected ? "bg-background/15" : "bg-foreground/5",
              )}
            >
              {counts[filter]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
