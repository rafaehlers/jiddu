"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Lang } from "../fallacies";
import { MESSAGES, type Messages } from "./messages";

type Ctx = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Messages;
};

const I18nCtx = createContext<Ctx | null>(null);

function readInitialLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const stored = localStorage.getItem("lang");
    if (stored === "en" || stored === "pt" || stored === "es") return stored;
    const nav = navigator.language?.toLowerCase() ?? "";
    if (nav.startsWith("pt")) return "pt";
    if (nav.startsWith("es")) return "es";
  } catch {}
  return "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => readInitialLang());

  // Keep <html lang="..."> in sync.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem("lang", next);
    } catch {}
  }, []);

  return (
    <I18nCtx.Provider value={{ lang, setLang, t: MESSAGES[lang] }}>
      {children}
    </I18nCtx.Provider>
  );
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
