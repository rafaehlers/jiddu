"use client";

import { FALLACY_BY_ID, type Lang } from "@/lib/fallacies";
import { useI18n } from "@/lib/i18n/provider";
import { ALL_FALLACIES_FILTER } from "@/lib/fallacy-filter";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  filters: readonly string[];
  counts: Readonly<Record<string, number>>;
  lang: Lang;
  onChange: (filter: string) => void;
  className?: string;
};

export function FallacyFilterBar({
  value,
  filters,
  counts,
  lang,
  onChange,
  className,
}: Props) {
  const { t } = useI18n();
  const options = [ALL_FALLACIES_FILTER, ...filters];

  return (
    <div
      className={cn("flex flex-wrap gap-1.5", className)}
      role="group"
      aria-label={t.fallacy_filter_label}
    >
      {options.map((filter) => {
        const selected = value === filter;
        const definition =
          filter === ALL_FALLACIES_FILTER
            ? null
            : FALLACY_BY_ID[filter];
        const label =
          filter === ALL_FALLACIES_FILTER
            ? t.fallacy_filter_all
            : (definition?.name[lang] ?? filter);

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
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                definition
                  ? undefined
                  : selected
                    ? "bg-background"
                    : "bg-foreground",
              )}
              style={
                definition ? { backgroundColor: definition.color } : undefined
              }
            />
            <span>{label}</span>
            <span
              className={cn(
                "inline-flex min-w-5 items-center justify-center rounded-full px-1 tabular-nums",
                selected ? "bg-background/15" : "bg-foreground/5",
              )}
            >
              {counts[filter] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
