"use client";

import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { EXTENSION_PAGES_COPY } from "@/lib/extension-pages-copy";
import { useI18n } from "@/lib/i18n/provider";

function renderPolicyText(text: string) {
  const parts = text.split(/(https:\/\/jiddu\.app\/contact|https:\/\/jiddu\.app)/g);

  return parts.map((part, index) => {
    if (part === "https://jiddu.app/contact") {
      return (
        <Link key={`${part}-${index}`} href="/contact" className="underline">
          {part}
        </Link>
      );
    }
    if (part === "https://jiddu.app") {
      return (
        <Link key={`${part}-${index}`} href="/" className="underline">
          {part}
        </Link>
      );
    }
    return part;
  });
}

export function ExtensionPrivacyBody() {
  const { lang } = useI18n();
  const copy = EXTENSION_PAGES_COPY[lang].privacy;

  return (
    <div className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
      <Link
        href="/extension"
        className="inline-flex items-center gap-2 text-sm font-semibold"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {copy.back}
      </Link>
      <header className="mt-12 border-b border-rule pb-10">
        <h1 className="font-serif text-5xl sm:text-6xl">{copy.title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
          {copy.subtitle}
        </p>
        <p className="mt-4 text-sm text-muted">{copy.updated}</p>
      </header>

      <aside className="my-10 rounded-xl border border-accent-edge bg-accent/10 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <ShieldCheck
            aria-hidden
            className="size-6 shrink-0 text-accent-hi"
          />
          <h2 className="font-serif text-2xl">{copy.limitedUseTitle}</h2>
        </div>
        <p className="mt-3 leading-7 text-muted">{copy.limitedUse}</p>
      </aside>

      <div className="divide-y divide-rule border-y border-rule">
        {copy.sections.map((section) => (
          <section key={section.title} className="py-9">
            <h2 className="font-serif text-3xl">{section.title}</h2>
            <div className="mt-4 space-y-4 leading-7 text-muted">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{renderPolicyText(paragraph)}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
