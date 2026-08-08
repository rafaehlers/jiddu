"use client";

import Link from "next/link";
import { useId } from "react";
import { useI18n } from "@/lib/i18n/provider";

export function ResultPageCta({ href }: { href: string }) {
  const { t } = useI18n();
  const titleId = useId();

  return (
    <aside
      aria-labelledby={titleId}
      className="mx-auto w-full max-w-5xl px-4 pb-10 sm:px-6 sm:pb-14"
      data-result-page-cta
    >
      <div className="rounded-xl border border-rule bg-paper p-6 sm:p-8">
        <h2 id={titleId} className="font-serif text-2xl">
          {t.result_cta_title}
        </h2>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted">
          {t.result_cta_description}
        </p>
        <Link
          href={href}
          className="mt-5 inline-flex rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {t.new_analysis}
        </Link>
      </div>
    </aside>
  );
}
