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
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-4 min-w-0">
          <Link
            href="/"
            className={
              variant === "home"
                ? "font-serif text-3xl tracking-tight shrink-0"
                : "font-serif text-2xl tracking-tight shrink-0"
            }
          >
            Jiddu
          </Link>
          <span className="font-serif italic text-muted text-sm md:text-base">
            {t.tagline}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/fallacies"
            className="text-sm text-muted hover:text-foreground transition-colors hidden md:inline"
          >
            {t.nav_fallacies}
          </Link>
          {rightSlot}
          <LangSelector />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
