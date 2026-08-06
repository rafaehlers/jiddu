"use client";

import { Fragment } from "react";
import { PageTitle } from "@/components/page-title";
import { useI18n } from "@/lib/i18n/provider";

// Public API / MCP docs page. Same structured-content pattern as LegalBody and
// HowItWorksBody (sections live in i18n), with one addition: a paragraph that
// is fenced with ``` is rendered as a code block instead of prose. Code blocks
// are identical across locales (curl / JSON), so only the prose translates.
export function ApiAccessBody() {
  const { t } = useI18n();
  const sections = t.api_access_sections;
  return (
    <article className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-10 sm:py-16 flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <PageTitle>{t.api_access_title}</PageTitle>
        <p className="text-muted text-base sm:text-lg">{t.api_access_subtitle}</p>
      </header>

      {sections.map((s, i) => (
        <section key={i} className="flex flex-col gap-3">
          <h2 className="font-serif text-xl">{s.title}</h2>
          {s.paragraphs.map((p, j) =>
            isCode(p) ? (
              <pre
                key={j}
                className="bg-paper border border-rule rounded-md p-3 sm:p-4 overflow-x-auto text-xs sm:text-sm"
              >
                <code>{stripFence(p)}</code>
              </pre>
            ) : (
              <p key={j} className="text-sm leading-relaxed text-foreground/85">
                {renderInline(p)}
              </p>
            ),
          )}
        </section>
      ))}
    </article>
  );
}

function isCode(p: string): boolean {
  return p.startsWith("```");
}

function stripFence(p: string): string {
  return p.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "");
}

// Minimal markdown-link renderer (same as legal-body / how-it-works-body):
// turns `[label](url)` into anchors, leaves everything else as-is. Also
// renders `inline code` spans wrapped in backticks.
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]+)\)|`([^`]+)`/g;
  let cursor = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > cursor) parts.push(text.slice(cursor, m.index));
    if (m[3] !== undefined) {
      parts.push(
        <code key={`c-${key++}`} className="text-[0.85em] bg-paper border border-rule rounded px-1 py-0.5">
          {m[3]}
        </code>,
      );
    } else {
      const isExternal = m[2].startsWith("http");
      parts.push(
        <a
          key={`l-${key++}`}
          href={m[2]}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="underline decoration-rule hover:decoration-foreground transition-colors"
        >
          {m[1]}
        </a>,
      );
    }
    cursor = m.index + m[0].length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts.length === 1 ? parts[0] : (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>{p}</Fragment>
      ))}
    </>
  );
}
