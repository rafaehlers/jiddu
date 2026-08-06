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
  rightSlot,
  showLogo = true,
}: Props) {
  const { t } = useI18n();
  return (
    <header className="border-b border-rule">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/"
            aria-label="Jiddu"
            className="flex shrink-0 items-center gap-2.5 sm:gap-3"
          >
            {showLogo && (
              <Image
                src="/brand/jiddu_logo_email.png"
                alt=""
                width={44}
                height={44}
                sizes="(min-width: 640px) 44px, 36px"
                className="size-9 rounded-[9px] border border-[#ded8ce] object-cover sm:size-11 sm:rounded-[10px]"
                priority
              />
            )}
            <span className="flex min-w-0 flex-col pt-2 leading-none">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d5533b] sm:text-xs">
                JIDDU
              </span>
              <span className="font-serif font-semibold text-foreground sm:text-xl">
                {t.tagline}
              </span>
            </span>
          </Link>
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
