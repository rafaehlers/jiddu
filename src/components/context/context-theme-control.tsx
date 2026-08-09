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
  const Icon = theme === "dark" ? Moon : Sun;
  return (
    <label className="inline-flex items-center gap-1 rounded-md border border-rule bg-paper px-2 py-1.5 text-xs text-muted">
      <Icon aria-hidden="true" className="size-3.5" />
      <select
        aria-label={copy.theme}
        className="bg-transparent text-foreground outline-none"
        style={{ colorScheme: theme }}
        value={theme}
        onChange={(event) => onChange(event.target.value as ContextTheme)}
      >
        <option
          className="bg-paper text-foreground"
          style={{
            backgroundColor: "var(--paper)",
            color: "var(--foreground)",
          }}
          value="dark"
        >
          {copy.darkTheme}
        </option>
        <option
          className="bg-paper text-foreground"
          style={{
            backgroundColor: "var(--paper)",
            color: "var(--foreground)",
          }}
          value="light"
        >
          {copy.lightTheme}
        </option>
      </select>
    </label>
  );
}
