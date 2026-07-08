"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

type Mode = "detector" | "factcheck" | "neutrality" | "explain";

/**
 * The four lens cards, doubling as the mode selector for the unified home.
 * Replaces both the PipelineSidebar (informational cards) and the mode tab
 * row inside UploadForm (navigation links) — one click switches the mode
 * in place, no page load.
 */
export function ModeCards({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (mode: Mode) => void;
}) {
  const { t } = useI18n();

  const cards: { key: Mode; name: string; desc: string }[] = [
    { key: "detector", name: t.mode_detector, desc: t.pipeline_fallacy_desc },
    { key: "factcheck", name: t.mode_factcheck, desc: t.pipeline_factcheck_desc },
    { key: "neutrality", name: t.mode_neutrality, desc: t.pipeline_neutrality_desc },
    { key: "explain", name: t.mode_explain, desc: t.pipeline_explain_desc },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={t.pipelines_heading}
      className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3"
    >
      {cards.map((c) => {
        const active = c.key === mode;
        return (
          <button
            key={c.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(c.key)}
            className={cn(
              "flex flex-col gap-1.5 p-3 sm:p-4 border rounded-lg text-left cursor-pointer transition-colors",
              // Selected = a quiet indigo tint + indigo border, in the same
              // color-mix idiom as the in-text highlights — not a solid fill,
              // which read as a heavy slab against the site's soft palette.
              active
                ? "border-[var(--accent-edge)] bg-[color-mix(in_oklab,var(--accent-hi)_10%,var(--paper))]"
                : "bg-paper border-rule hover:border-foreground/40",
            )}
          >
            <h3
              className={cn(
                "font-serif text-base font-medium",
                active ? "text-accent-hi" : "text-foreground",
              )}
            >
              {c.name}
            </h3>
            {/* Description hidden on the smallest screens so the 2×2 grid
                stays compact and the form remains above the fold. */}
            <p
              className={cn(
                "text-sm leading-snug hidden sm:block",
                active ? "text-foreground/85" : "text-muted",
              )}
            >
              {c.desc}
            </p>
          </button>
        );
      })}
    </div>
  );
}
