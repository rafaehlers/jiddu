"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { contextCopy } from "@/components/context/context-copy";

type Mode =
  "detector" | "factcheck" | "neutrality" | "explain" | "slop" | "review";

/**
 * The six lens cards double as the mode selector for the unified home. Live
 * and Context link to their dedicated real-time experiences.
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
  const { lang, t } = useI18n();
  const context = contextCopy(lang);

  const cards: { key: Mode; name: string; desc: string }[] = [
    { key: "detector", name: t.mode_detector, desc: t.pipeline_fallacy_desc },
    {
      key: "factcheck",
      name: t.mode_factcheck,
      desc: t.pipeline_factcheck_desc,
    },
    {
      key: "neutrality",
      name: t.mode_neutrality,
      desc: t.pipeline_neutrality_desc,
    },
    { key: "explain", name: t.mode_explain, desc: t.pipeline_explain_desc },
    { key: "slop", name: t.mode_slop, desc: t.pipeline_slop_desc },
    { key: "review", name: t.mode_review, desc: t.pipeline_review_desc },
  ];

  return (
    <div
      role="group"
      aria-label={t.pipelines_heading}
      className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4"
    >
      {cards.map((c) => {
        const active = c.key === mode;
        return (
          <button
            key={c.key}
            type="button"
            aria-pressed={active}
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

      <Link
        href="/live"
        className="flex cursor-pointer flex-col gap-1.5 rounded-lg border border-rule bg-paper p-3 text-left transition-colors hover:border-foreground/40 sm:p-4"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-serif text-base font-medium text-foreground">
            {t.mode_live}
          </h3>
          <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-hi">
            Beta
          </span>
        </div>
        <p className="hidden text-sm leading-snug text-muted sm:block">
          {t.pipeline_live_desc}
        </p>
      </Link>

      <Link
        href="/context"
        className="flex cursor-pointer flex-col gap-1.5 rounded-lg border border-rule bg-paper p-3 text-left transition-colors hover:border-foreground/40 sm:p-4"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-serif text-base font-medium text-foreground">
            {context.title}
          </h3>
          <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-hi">
            Beta
          </span>
        </div>
        <p className="hidden text-sm leading-snug text-muted sm:block">
          {context.subtitle}
        </p>
      </Link>
    </div>
  );
}
