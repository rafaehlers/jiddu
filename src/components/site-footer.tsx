"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import Link from "next/link";
import { useAuthControlsEnabled } from "@/components/auth-controls";
import { useI18n } from "@/lib/i18n/provider";

export function SiteFooter() {
  const { t, lang } = useI18n();
  const { user, loading } = useAuth();
  const authEnabled = useAuthControlsEnabled();
  const accountLabel =
    lang === "pt" ? "Conta" : lang === "es" ? "Cuenta" : "Account";
  const signUpLabel =
    lang === "pt"
      ? "Criar conta"
      : lang === "es"
        ? "Crear cuenta"
        : "Create account";

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
            href="/fallacies"
            className="hover:text-accent-hi transition-colors"
          >
            {t.nav_fallacies}
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="/slop-patterns"
            className="hover:text-accent-hi transition-colors"
          >
            {t.nav_slop_patterns}
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="/benchmark"
            className="hover:text-accent-hi transition-colors"
          >
            {t.nav_benchmark}
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="/pricing"
            className="hover:text-accent-hi transition-colors"
          >
            {t.nav_pricing}
          </Link>
          <span aria-hidden>·</span>
          <Link
            href="/api-access"
            className="hover:text-accent-hi transition-colors"
          >
            {t.nav_api}
          </Link>
          {authEnabled && !loading && (
            <>
              <span aria-hidden>·</span>
              <Link
                href={user ? "/account" : "/signup"}
                className="hover:text-accent-hi transition-colors"
              >
                {user ? accountLabel : signUpLabel}
              </Link>
            </>
          )}
          <span aria-hidden>·</span>
          <Link
            href="/legal"
            className="hover:text-accent-hi transition-colors"
          >
            {t.nav_legal}
          </Link>
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
      </div>
    </footer>
  );
}
