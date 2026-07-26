"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LangSelector } from "@/components/lang-selector";
import { useI18n } from "@/lib/i18n/provider";

type Props = {
  variant?: "home" | "viewer" | "guide";
  rightSlot?: React.ReactNode;
};

export function SiteHeader({ variant = "home", rightSlot }: Props) {
  const { t } = useI18n();
  return (
    <header className="border-b border-rule">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3 sm:gap-4 min-w-0">
          <Link
            href="/"
            className={
              variant === "home"
                ? "font-serif text-2xl sm:text-3xl tracking-tight shrink-0"
                : "font-serif text-xl sm:text-2xl tracking-tight shrink-0"
            }
          >
            Jiddu
          </Link>
          <span className="font-serif italic text-muted text-sm md:text-base hidden sm:inline">
            {t.tagline}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Single nav link — the guides, benchmark and API docs moved to
              the footer to keep the header quiet. */}
          <Link
            href="/how-it-works"
            className="text-sm text-muted hover:text-accent-hi transition-colors hidden md:inline"
          >
            {t.nav_how_it_works}
          </Link>
          {rightSlot}
          <LangSelector />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
