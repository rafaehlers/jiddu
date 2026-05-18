"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="mt-auto border-t border-rule">
      <div className="mx-auto max-w-5xl px-6 py-6 text-sm text-muted flex flex-wrap items-center justify-between gap-2">
        <span className="font-serif italic">
          {t.footer_quote}{" "}
          <span className="not-italic">—</span>{" "}
          <a
            href="https://en.wikipedia.org/wiki/Jiddu_Krishnamurti"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-rule hover:decoration-foreground transition-colors"
          >
            J. Krishnamurti
          </a>
        </span>
        <span className="flex items-center gap-3">
          <Link
            href="/legal"
            className="underline decoration-rule hover:decoration-foreground transition-colors"
          >
            {t.nav_legal}
          </Link>
          <span aria-hidden>·</span>
          <span>
            ©{" "}
            <a
              href="https://www.linkedin.com/in/rafael-m-ehlers/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-rule hover:decoration-foreground transition-colors"
            >
              Rafael de Menezes Ehlers
            </a>
          </span>
        </span>
      </div>
    </footer>
  );
}
