"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";

// OpenRouter bills in USD, so the balance is always shown in USD regardless
// of the UI language.
const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function SiteFooter() {
  const { t } = useI18n();
  const [remaining, setRemaining] = useState<number | null>(null);

  // Fetch the operator's remaining OpenRouter credits once per mount. The
  // route is cached (5 min server-side + Cache-Control), so this is cheap;
  // any failure just leaves the figure hidden.
  useEffect(() => {
    let alive = true;
    fetch("/api/openrouter-balance")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d && typeof d.remaining === "number") {
          setRemaining(d.remaining);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <footer className="mt-auto border-t border-rule">
      <div className="mx-auto max-w-5xl px-6 py-6 text-sm text-muted flex flex-col items-center justify-center text-center gap-3">
        <span className="font-serif italic">
          {t.footer_quote}{" "}
          <span className="not-italic">—</span>{" "}
          <a
            href="https://en.wikipedia.org/wiki/Jiddu_Krishnamurti"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent-hi transition-colors"
          >
            J. Krishnamurti
          </a>
        </span>
        <span className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/how-it-works"
            className="hover:text-accent-hi transition-colors"
          >
            {t.nav_how_it_works}
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="/legal"
            className="hover:text-accent-hi transition-colors"
          >
            {t.nav_legal}
          </Link>
          <span aria-hidden>·</span>
          {/* AGPL-3.0 §13 requires that operators of a network-accessible
              service make the corresponding source available to users. A
              link to the canonical repo from the footer satisfies that. */}
          <a
            href="https://github.com/rafaehlers/jiddu"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-accent-hi transition-colors"
            title="Source code (AGPL-3.0-or-later)"
          >
            <GithubIcon className="h-4 w-4" />
            {t.nav_source}
          </a>
          <span aria-hidden>·</span>
          {/* AGPL-3.0 is the project's license; link to the canonical text so
              users of this network service know their rights under §13. */}
          <a
            href="https://www.gnu.org/licenses/agpl-3.0.txt"
            target="_blank"
            rel="noopener noreferrer license"
            className="hover:text-accent-hi transition-colors"
            title="GNU Affero General Public License v3.0 or later"
          >
            AGPL-3.0
          </a>
          <span aria-hidden>·</span>
          <span>
            © 2026{" "}
            <a
              href="https://rafaelmehlers.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent-hi transition-colors"
            >
              Rafael M. Ehlers
            </a>
          </span>
        </span>
        {remaining !== null && (
          <span className="text-xs text-muted/80">
            {t.footer_balance(USD.format(remaining))}
          </span>
        )}
      </div>
    </footer>
  );
}

// lucide-react deliberately ships no brand/logo icons (trademark reasons),
// so the GitHub mark is inlined here — standard Octicons "mark-github" path.
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
