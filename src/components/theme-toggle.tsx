"use client";

import { Moon, Sun } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { useSiteTheme } from "@/lib/site-theme";

export function ThemeToggle() {
  const { t } = useI18n();
  const [theme, setTheme] = useSiteTheme();

  function toggle() {
    setTheme(theme === "light" ? "dark" : "light");
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
