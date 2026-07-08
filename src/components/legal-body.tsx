"use client";

import { Fragment } from "react";
import { useI18n } from "@/lib/i18n/provider";

// Plain-text legal/disclaimer page. Content lives in i18n so the three
// locales stay in sync; the structure (headings + paragraphs) is rendered
// here so we can update sections in one place.
//
// Paragraphs may include markdown-style links: `[label](https://...)`.
// We render those as anchor tags. Other markdown is intentionally NOT
// supported — we want predictable copy, not a wiki.
export function LegalBody() {
  const { t } = useI18n();
  const sections = t.legal_sections;
  return (
    <article className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-10 sm:py-16 flex flex-col gap-8">
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
              {renderInline(p)}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}

// Minimal markdown-link renderer: turns `[label](url)` segments into
// anchor tags while leaving everything else as-is. Quotes, em-dashes,
// punctuation pass through untouched. Accepts both external (http/https)
// URLs and internal absolute paths (e.g. `/benchmark`) — same pattern
// as how-it-works-body. External links open in a new tab; internal
// links stay in the current one.
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
