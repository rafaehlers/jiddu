"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const { t } = useI18n();

  // Must initialize as "dark" (the default) on both server and client.
  // The themeInitScript in layout.tsx adds the ".light" class to <html>
  // before React hydrates, so a lazy-initializer that reads
  // document.documentElement.classList would return "light" for those
  // users *during* hydration — server said "dark", client says "light",
  // React throws #418. Move the DOM read to useEffect so it only runs
  // after hydration is complete.
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    if (document.documentElement.classList.contains("light")) {
      setTheme("light");
    }
  }, []);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
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
