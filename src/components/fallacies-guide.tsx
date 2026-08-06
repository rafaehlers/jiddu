"use client";

import { useMemo } from "react";
import { PageTitle } from "@/components/page-title";
import { CATEGORY_LABELS, FALLACIES, type FallacyDef } from "@/lib/fallacies";
import { useI18n } from "@/lib/i18n/provider";

const CATEGORY_ORDER: FallacyDef["category"][] = [
  "relevance",
  "presumption",
  "causal",
  "evidence",
  "ambiguity",
  "emotional",
];

export function FallaciesGuide() {
  const { t, lang } = useI18n();

  const grouped = useMemo(() => {
    const m = new Map<FallacyDef["category"], FallacyDef[]>();
    for (const f of FALLACIES) {
      if (!m.has(f.category)) m.set(f.category, []);
      m.get(f.category)!.push(f);
    }
    return m;
  }, []);

  return (
    <article className="mx-auto max-w-5xl w-full px-6 py-12 flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <PageTitle>{t.guide_title}</PageTitle>
        <p className="text-muted text-lg max-w-2xl">{t.guide_subtitle}</p>
      </header>

      <nav className="flex flex-wrap gap-2 text-xs text-muted">
        {CATEGORY_ORDER.filter((c) => grouped.has(c)).map((c) => (
          <a
            key={c}
            href={`#cat-${c}`}
            className="px-2 py-1 rounded border border-rule hover:border-foreground hover:text-foreground transition-colors"
          >
            {CATEGORY_LABELS[c][lang]}
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
              {CATEGORY_LABELS[c][lang]}
            </h2>
            <div className="flex flex-col gap-8">
              {grouped.get(c)!.map((f) => (
                <article key={f.id} id={f.id} className="flex flex-col gap-2 scroll-mt-24">
                  <h3 className="font-serif text-xl flex items-center gap-3">
                    <span
                      className="inline-block h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: f.color }}
                      aria-hidden
                    />
                    <a
                      href={`#${f.id}`}
                      className="hover:underline underline-offset-4 decoration-rule"
                    >
                      {f.name[lang]}
                    </a>
                  </h3>
                  <p className="text-foreground/90 leading-relaxed">
                    {f.description[lang]}
                  </p>
                  <blockquote className="border-l-2 border-rule pl-4 text-muted italic">
                    <span className="text-xs not-italic uppercase tracking-wide block mb-1">
                      {t.guide_example}
                    </span>
                    {f.example[lang]}
                  </blockquote>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Courtesy credit: the fallacy selection was cross-checked against
          The Fallacy Guide's index; all descriptions and examples above are
          Jiddu's own (their content is unlicensed and can't be reproduced). */}
      <p className="text-sm text-muted border-t border-rule pt-4">
        {t.guide_credit_prefix}{" "}
        <a
          href="https://fallacyguide.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-accent-hi transition-colors"
        >
          The Fallacy Guide
        </a>{" "}
        {t.guide_credit_suffix}
      </p>
    </article>
  );
}
