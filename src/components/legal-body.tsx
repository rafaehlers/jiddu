"use client";

import { useI18n } from "@/lib/i18n/provider";

// Plain-text legal/disclaimer page. Content lives in i18n so the three
// locales stay in sync; the structure (headings + paragraphs) is rendered
// here so we can update sections in one place.
export function LegalBody() {
  const { t } = useI18n();
  const sections = t.legal_sections;
  return (
    <article className="mx-auto max-w-2xl w-full px-4 sm:px-6 py-10 sm:py-16 flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl sm:text-4xl">{t.legal_title}</h1>
        <p className="text-sm text-muted">{t.legal_subtitle}</p>
        <p className="text-xs text-muted mt-2">{t.legal_last_updated}</p>
      </header>

      {sections.map((s, i) => (
        <section key={i} className="flex flex-col gap-2">
          <h2 className="font-serif text-xl">{s.title}</h2>
          {s.paragraphs.map((p, j) => (
            <p key={j} className="text-sm leading-relaxed text-foreground/85">
              {p}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
