"use client";

import {
  Check,
  MessagesSquare,
  SearchCheck,
  Scale,
  ShieldAlert,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import type { LiveLens } from "@/lib/live-lenses";

type Props = {
  disabled: boolean;
  value: LiveLens[];
  onChange: (value: LiveLens[]) => void;
};

const OPTIONS = [
  { id: "context", icon: MessagesSquare, label: "live_lens_context" },
  { id: "fallacy", icon: ShieldAlert, label: "live_lens_fallacy" },
  { id: "factcheck", icon: SearchCheck, label: "live_lens_factcheck" },
  { id: "neutrality", icon: Scale, label: "live_lens_neutrality" },
] as const;

export function LiveLensPicker({ disabled, value, onChange }: Props) {
  const { t } = useI18n();

  const toggle = (lens: LiveLens) => {
    if (disabled) return;
    if (value.includes(lens) && value.length === 1) return;
    onChange(
      value.includes(lens)
        ? value.filter((item) => item !== lens)
        : [...value, lens],
    );
  };

  return (
    <fieldset className="mb-5 rounded-lg border border-rule bg-paper p-3">
      <legend className="px-1 text-sm font-medium">{t.live_lenses_title}</legend>
      <p className="mb-3 text-xs text-muted">{t.live_lenses_hint}</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {OPTIONS.map(({ id, icon: Icon, label }) => {
          const selected = value.includes(id);
          const isLastSelected = selected && value.length === 1;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={selected}
              disabled={disabled || isLastSelected}
              onClick={() => toggle(id)}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors disabled:cursor-default ${
                selected
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-rule text-muted hover:text-foreground"
              }`}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              <span>{t[label]}</span>
              <span
                aria-hidden="true"
                className={`ml-auto flex size-4 items-center justify-center rounded-full border ${
                  selected
                    ? "border-accent bg-accent text-white"
                    : "border-rule bg-transparent"
                }`}
              >
                {selected ? (
                  <Check className="size-3" strokeWidth={3} />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
