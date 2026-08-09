"use client";

import { useEffect, useSyncExternalStore } from "react";

export type SiteTheme = "light" | "dark";

const THEME_STORAGE_KEY = "theme";
const THEME_COOKIE_KEY = "jiddu_theme";

function readTheme(): SiteTheme {
  return document.documentElement.classList.contains("light")
    ? "light"
    : "dark";
}

function applyDocumentTheme(theme: SiteTheme) {
  document.documentElement.classList.toggle("light", theme === "light");
}

function subscribeTheme(notify: () => void): () => void {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  const syncAcrossTabs = (event: StorageEvent) => {
    if (
      event.key === THEME_STORAGE_KEY &&
      (event.newValue === "light" || event.newValue === "dark")
    ) {
      applyDocumentTheme(event.newValue);
      notify();
    }
  };
  window.addEventListener("storage", syncAcrossTabs);

  return () => {
    observer.disconnect();
    window.removeEventListener("storage", syncAcrossTabs);
  };
}

export function setSiteTheme(theme: SiteTheme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The cookie and in-memory DOM preference still keep the theme usable.
  }
  try {
    document.cookie = `${THEME_COOKIE_KEY}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch {
    // The current document can still reflect the selected theme.
  }
  applyDocumentTheme(theme);
}

export function useSiteTheme() {
  // The server applies the cookie-backed class. This effect migrates the
  // previous localStorage-only preference and keeps both stores in sync.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark") setSiteTheme(stored);
    } catch {
      // Keep the cookie-backed theme when browser storage is unavailable.
    }
  }, []);

  const theme = useSyncExternalStore<SiteTheme>(
    subscribeTheme,
    readTheme,
    () => "dark",
  );
  return [theme, setSiteTheme] as const;
}
