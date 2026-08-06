"use client";

import { useMemo } from "react";
import { PageTitle } from "@/components/page-title";
import { SLOP_CATEGORY_LABELS, SLOP_PATTERNS, type SlopDef } from "@/lib/slop";
import { useI18n } from "@/lib/i18n/provider";

const CATEGORY_ORDER: SlopDef["category"][] = [
  "wording",
  "drama",
  "structure",
  "substance",
  "format",
];

// Reference page for the slop-pattern catalog — same layout as the
// fallacies guide (category nav, per-pattern anchor with color dot,
// description and example).
export function SlopGuide() {
  const { t, lang } = useI18n();

  const grouped = useMemo(() => {
    const m = new Map<SlopDef["category"], SlopDef[]>();
    for (const p of SLOP_PATTERNS) {
      if (!m.has(p.category)) m.set(p.category, []);
      m.get(p.category)!.push(p);
    }
    return m;
  }, []);

  return (
    <article className="mx-auto max-w-5xl w-full px-6 py-12 flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <PageTitle>{t.slop_guide_title}</PageTitle>
        <p className="text-muted text-lg max-w-2xl">{t.slop_guide_subtitle}</p>
      </header>

      <nav className="flex flex-wrap gap-2 text-xs text-muted">
        {CATEGORY_ORDER.filter((c) => grouped.has(c)).map((c) => (
          <a
            key={c}
            href={`#cat-${c}`}
            className="px-2 py-1 rounded border border-rule hover:border-foreground hover:text-foreground transition-colors"
          >
            {SLOP_CATEGORY_LABELS[c][lang]}
          </a>
        ))}
      </nav>

      <div className="flex flex-col gap-12">
        {CATEGORY_ORDER.filter((c) => grouped.has(c)).map((c) => (
          <section key={c} className="flex flex-col gap-6">
            <h2
              id={`cat-${c}`}
              className="font-serif text-2xl border-b border-rule pb-2"
            >
              {SLOP_CATEGORY_LABELS[c][lang]}
            </h2>
            <div className="flex flex-col gap-8">
              {grouped.get(c)!.map((p) => (
                <article key={p.id} id={p.id} className="flex flex-col gap-2 scroll-mt-24">
                  <h3 className="font-serif text-xl flex items-center gap-3">
                    <span
                      className="inline-block h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: p.color }}
                      aria-hidden
                    />
                    <a
                      href={`#${p.id}`}
                      className="hover:underline underline-offset-4 decoration-rule"
                    >
                      {p.name[lang]}
                    </a>
                  </h3>
                  <p className="text-foreground/90 leading-relaxed">
                    {p.description[lang]}
                  </p>
                  <blockquote className="border-l-2 border-rule pl-4 text-muted italic">
                    <span className="text-xs not-italic uppercase tracking-wide block mb-1">
                      {t.guide_example}
                    </span>
                    {p.example[lang]}
                  </blockquote>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
