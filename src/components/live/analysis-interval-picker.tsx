"use client";

import { useI18n } from "@/lib/i18n/provider";

type Props = {
  disabled: boolean;
  value: number;
  onChange: (value: number) => void;
};

const INTERVALS = [
  { value: 10_000, label: "10s" },
  { value: 20_000, label: "20s" },
  { value: 30_000, label: "30s" },
  { value: 60_000, label: "1 min" },
] as const;

export function LiveAnalysisIntervalPicker({
  disabled,
  value,
  onChange,
}: Props) {
  const { t } = useI18n();

  return (
    <fieldset className="mb-5 rounded-lg border border-rule bg-paper p-3">
      <legend className="px-1 text-sm font-medium">
        {t.live_interval_title}
      </legend>
      <div className="grid grid-cols-4 overflow-hidden rounded-md border border-rule">
        {INTERVALS.map((interval, index) => {
          const selected = value === interval.value;
          return (
            <button
              key={interval.value}
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onChange(interval.value)}
              className={`px-3 py-2 text-sm font-medium transition-colors disabled:cursor-default ${
                index > 0 ? "border-l border-rule" : ""
              } ${
                selected
                  ? "bg-accent text-white"
                  : "text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              {interval.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">{t.live_interval_hint}</p>
    </fieldset>
  );
}
