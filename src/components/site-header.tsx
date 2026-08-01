"use client";

import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LangSelector } from "@/components/lang-selector";
import { AuthControls } from "@/components/auth-controls";
import { useI18n } from "@/lib/i18n/provider";

type Props = {
  variant?: "home" | "viewer" | "guide";
  rightSlot?: React.ReactNode;
  showLogo?: boolean;
};

export function SiteHeader({
  variant = "home",
  rightSlot,
  showLogo = true,
}: Props) {
  const { t } = useI18n();
  return (
    <header className="border-b border-rule">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link
            href="/"
            className={`flex items-center gap-2 shrink-0 ${
              variant === "home"
                ? "font-serif text-2xl sm:text-3xl tracking-tight"
                : "font-serif text-xl sm:text-2xl tracking-tight"
            }`}
          >
            {showLogo && (
              <span
                className={
                  variant === "home"
                    ? "relative hidden size-10 sm:block"
                    : "relative hidden size-9 sm:block"
                }
                aria-hidden="true"
              >
                <Image
                  src="/brand/jiddu_logo_inverted_128.webp"
                  alt=""
                  fill
                  sizes="40px"
                  className="jiddu-brand-logo jiddu-brand-logo-inverted object-contain"
                  priority
                />
                <Image
                  src="/brand/jiddu_logo_128.webp"
                  alt=""
                  fill
                  sizes="40px"
                  className="jiddu-brand-logo jiddu-brand-logo-default object-contain"
                  priority
                />
              </span>
            )}
            <span>Jiddu</span>
          </Link>
          <span className="font-serif italic text-muted text-sm md:text-base hidden sm:inline">
            {t.tagline}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {rightSlot}
          <AuthControls leadingSeparator={Boolean(rightSlot)} />
          <LangSelector />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
