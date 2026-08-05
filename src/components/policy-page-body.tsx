"use client";

import { Fragment } from "react";
import Link from "next/link";
import {
  POLICY_PAGES_COPY,
  type PolicyPageCopy,
} from "@/lib/policy-pages-copy";
import { useI18n } from "@/lib/i18n/provider";

type PolicyKind = "privacy" | "terms";

export function PolicyPageBody({ kind }: { kind: PolicyKind }) {
  const { lang } = useI18n();
  const copy = POLICY_PAGES_COPY[lang][kind];

  return (
    <article className="mx-auto w-full max-w-5xl px-6 py-14 sm:py-20">
      <header className="border-b border-rule pb-10">
        <h1 className="font-serif text-4xl sm:text-6xl">{copy.title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">
          {copy.subtitle}
        </p>
        <p className="mt-4 text-sm text-muted">{copy.updated}</p>
      </header>

      <div className="divide-y divide-rule border-b border-rule">
        {copy.sections.map((section) => (
          <section key={section.title} className="py-9">
            <h2 className="font-serif text-2xl sm:text-3xl">
              {section.title}
            </h2>
            <div className="mt-4 space-y-4 leading-7 text-muted">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{renderInline(paragraph)}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]+)\)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > cursor) parts.push(text.slice(cursor, match.index));

    const href = match[2];
    const external = href.startsWith("http");
    parts.push(
      external ? (
        <a
          key={`link-${key++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-rule underline-offset-4 transition-colors hover:decoration-foreground"
        >
          {match[1]}
        </a>
      ) : (
        <Link
          key={`link-${key++}`}
          href={href}
          className="underline decoration-rule underline-offset-4 transition-colors hover:decoration-foreground"
        >
          {match[1]}
        </Link>
      ),
    );
    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts.length === 1 ? (
    parts[0]
  ) : (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>{part}</Fragment>
      ))}
    </>
  );
}

export type { PolicyPageCopy };
