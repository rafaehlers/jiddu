"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore, type CSSProperties } from "react";
import type { ContextCopy } from "./context-copy";

export type ContextTheme = "dark" | "light";

const STORAGE_KEY = "jiddu_context_theme_v1";
const CHANGE_EVENT = "jiddu-context-theme-change";
type ContextThemeStyle = CSSProperties & Record<`--${string}`, string | number>;

const THEME_STYLES = {
  dark: {
    "--background": "rgb(7, 7, 7)",
    "--foreground": "rgb(251, 251, 251)",
    "--paper": "rgb(17, 17, 17)",
    "--ink": "rgb(251, 251, 251)",
    "--muted": "rgb(145, 145, 145)",
    "--rule": "rgb(34, 34, 34)",
    "--accent": "rgb(226, 226, 226)",
    "--accent-hi": "rgb(244, 244, 244)",
    "--accent-edge": "rgb(74, 74, 74)",
    "--severity-low": "rgb(228, 178, 102)",
    "--severity-high": "rgb(232, 102, 78)",
    colorScheme: "dark",
  },
  light: {
    "--background": "rgb(247, 247, 247)",
    "--foreground": "rgb(18, 18, 18)",
    "--paper": "rgb(255, 255, 255)",
    "--ink": "rgb(18, 18, 18)",
    "--muted": "rgb(102, 102, 102)",
    "--rule": "rgb(220, 220, 220)",
    "--accent": "rgb(24, 24, 24)",
    "--accent-hi": "rgb(7, 7, 7)",
    "--accent-edge": "rgb(178, 178, 178)",
    "--severity-low": "rgb(184, 128, 44)",
    "--severity-high": "rgb(202, 67, 45)",
    colorScheme: "light",
  },
} satisfies Record<ContextTheme, ContextThemeStyle>;

export function contextThemeStyle(theme: ContextTheme): CSSProperties {
  return THEME_STYLES[theme];
}

function readTheme(): ContextTheme {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "light"
      ? "light"
      : "dark";
  } catch {
    return "dark";
  }
}

function subscribeTheme(notify: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) notify();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(CHANGE_EVENT, notify);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CHANGE_EVENT, notify);
  };
}

export function useContextTheme() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    readTheme,
    (): ContextTheme => "dark",
  );

  const setTheme = (next: ContextTheme) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      // Dark remains the safe default when browser storage is unavailable.
    }
  };

  return [theme, setTheme] as const;
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
