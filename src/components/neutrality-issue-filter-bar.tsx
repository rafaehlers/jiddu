"use client";

import type { Messages } from "@/lib/i18n/messages";
import { useI18n } from "@/lib/i18n/provider";
import {
  NEUTRALITY_ISSUE_FILTERS,
  type NeutralityIssueFilter,
} from "@/lib/neutrality-issue-filter";
import { NEUTRALITY_ISSUE_META } from "@/components/neutrality-visuals";
import { cn } from "@/lib/utils";

const DOT_CLASS: Record<NeutralityIssueFilter, string> = {
  all: "bg-foreground",
  loaded_language: "bg-red-500",
  asymmetric_attribution: "bg-amber-500",
  false_equivalence: "bg-purple-500",
  selective_omission: "bg-blue-500",
  source_asymmetry: "bg-pink-500",
  both_sidesing: "bg-emerald-500",
  steering: "bg-cyan-500",
  genetic_framing: "bg-orange-500",
};

type Props = {
  value: NeutralityIssueFilter;
  counts: Readonly<Record<NeutralityIssueFilter, number>>;
  onChange: (filter: NeutralityIssueFilter) => void;
  className?: string;
};

export function NeutralityIssueFilterBar({
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
      aria-label={t.neutrality_filter_label}
    >
      {NEUTRALITY_ISSUE_FILTERS.map((filter) => {
        const selected = value === filter;
        const labelKey: keyof Messages =
          filter === "all"
            ? "neutrality_filter_all"
            : NEUTRALITY_ISSUE_META[filter].labelKey;

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
              className={cn("size-1.5 rounded-full", DOT_CLASS[filter])}
            />
            <span>{String(t[labelKey])}</span>
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
