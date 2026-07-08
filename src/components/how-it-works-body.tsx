"use client";

import { Fragment } from "react";
import { useI18n } from "@/lib/i18n/provider";

// Technical walkthrough of every Jiddu pipeline. Same content pattern as
// LegalBody: structured array of {title, paragraphs} lives in i18n so the
// three locales stay in sync. Paragraphs render markdown-style links —
// [label](url) — inline.
export function HowItWorksBody() {
  const { t } = useI18n();
  const sections = t.how_it_works_sections;
  return (
    <article className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-10 sm:py-16 flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl sm:text-4xl">
          {t.how_it_works_title}
        </h1>
        <p className="text-sm text-muted">{t.how_it_works_subtitle}</p>
      </header>

      {/* Tiny TOC — anchor links to each section so a reader can scan. */}
      <nav className="text-sm text-muted border border-rule rounded-md p-4 flex flex-col gap-1">
        {sections.map((s, i) => (
          <a
            key={i}
            href={`#section-${i}`}
            className="underline decoration-rule hover:decoration-foreground transition-colors"
          >
            {s.title}
          </a>
        ))}
      </nav>

      {sections.map((s, i) => (
        <section
          key={i}
          id={`section-${i}`}
          className="flex flex-col gap-2 scroll-mt-16"
        >
          <h2 className="font-serif text-xl">{s.title}</h2>
          {s.paragraphs.map((p, j) => (
            <p key={j} className="text-sm leading-relaxed text-foreground/85">
              {renderInline(p)}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}

// Same minimal markdown-link renderer as LegalBody. Keep duplicated for
// now — extracting to a shared util is overkill for two call sites.
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]+)\)/g;
  let cursor = 0;
  let m: RegExpExecArray | null;
  let keyCounter = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > cursor) parts.push(text.slice(cursor, m.index));
    const isExternal = m[2].startsWith("http");
    parts.push(
      <a
        key={`l-${keyCounter++}`}
        href={m[2]}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="underline decoration-rule hover:decoration-foreground transition-colors"
      >
        {m[1]}
      </a>,
    );
    cursor = m.index + m[0].length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts.length === 1 ? (
    parts[0]
  ) : (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>{p}</Fragment>
      ))}
    </>
  );
}
