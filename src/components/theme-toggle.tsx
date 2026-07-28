"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

type Theme = "light" | "dark";

function readTheme(): Theme {
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

function subscribeTheme(notify: () => void): () => void {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

export function ThemeToggle() {
  const { t } = useI18n();

  // The server snapshot stays dark so hydration matches. Once subscribed,
  // the DOM class installed by the pre-hydration script is the source of truth.
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "dark");

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("light", next === "light");
  }

  const label = theme === "light" ? t.theme_to_dark : t.theme_to_light;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-rule text-muted hover:text-foreground hover:border-foreground transition-colors"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
