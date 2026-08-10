"use client";

import { Moon, Sun } from "lucide-react";
import type { CSSProperties } from "react";
import { useSiteTheme, type SiteTheme } from "@/lib/site-theme";
import type { ContextCopy } from "./context-copy";

export type ContextTheme = SiteTheme;

export function contextThemeStyle(theme: ContextTheme): CSSProperties {
  return { colorScheme: theme };
}

export function useContextTheme() {
  return useSiteTheme();
}

export function ContextThemeSelector({
  theme,
  onChange,
  copy,
}: {
  theme: ContextTheme;
  onChange: (theme: ContextTheme) => void;
  copy: ContextCopy;
}) {
  const nextTheme = theme === "light" ? "dark" : "light";
  const label = `${copy.theme}: ${
    nextTheme === "dark" ? copy.darkTheme : copy.lightTheme
  }`;

  return (
    <button
      type="button"
      onClick={() => onChange(nextTheme)}
      aria-label={label}
      title={label}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-rule bg-paper text-muted transition-colors hover:border-foreground hover:text-foreground"
    >
      {theme === "dark" ? (
        <Sun aria-hidden="true" className="size-4" />
      ) : (
        <Moon aria-hidden="true" className="size-4" />
      )}
    </button>
  );
}
