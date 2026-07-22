"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

// Adapted from the 404 page at rafaelmehlers.com.br (same author) — the
// broken-path illustration pairs naturally with Jiddu's own tagline, itself
// a Krishnamurti quote ("truth is a pathless land").
export function NotFoundBody() {
  const { t } = useI18n();
  return (
    <article className="mx-auto max-w-2xl w-full px-6 pt-16 pb-24 sm:pt-24 flex flex-col items-center text-center">
      <Image
        src="/404.webp"
        alt="An ink-drawn stone path that crumbles into scattered rubble and ends in nothing, with the faint wireframe outline of a seated figure at its broken edge."
        width={1020}
        height={502}
        priority
        className="w-full max-w-xl h-auto mb-6"
      />
      <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted mb-4">
        {t.not_found_label}
      </p>
      <h1 className="font-serif text-4xl sm:text-5xl leading-tight mb-5 text-balance">
        {t.not_found_title}
      </h1>
      <p className="text-lg leading-relaxed text-muted max-w-md mb-8">
        {t.not_found_subtitle}
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.not_found_cta}
      </Link>
    </article>
  );
}
