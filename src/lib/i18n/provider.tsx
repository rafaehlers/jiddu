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

// Cookie that survives the React tree. The server reads it on each
// request (see app/layout.tsx) so the initial render lands in the
// user's chosen language and no hydration mismatch occurs.
const COOKIE_NAME = "jiddu_lang";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function writeCookie(lang: Lang) {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${lang}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

export function I18nProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  // Lang chosen server-side (cookie → Accept-Language → "en"). Must
  // be passed by the layout for hydration to be clean.
  initialLang: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  // Keep <html lang="..."> in sync. The layout already sets it from
  // the cookie on first render; this catches client-side switches.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // First-time visitors arrive without a cookie. The layout falls
  // back to Accept-Language, then "en". If no cookie is set yet,
  // pick the best client-side signal and persist it:
  //   1. legacy localStorage value (so users who set the language
  //      before we switched to cookies don't lose their preference),
  //   2. otherwise the current `lang` from server resolution.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const hasCookie = document.cookie
      .split("; ")
      .some((c) => c.startsWith(`${COOKIE_NAME}=`));
    if (hasCookie) return;
    try {
      const legacy = localStorage.getItem("lang");
      if (legacy === "en" || legacy === "pt" || legacy === "es") {
        if (legacy !== lang) setLangState(legacy);
        writeCookie(legacy as Lang);
        // Optional cleanup; harmless if it fails.
        localStorage.removeItem("lang");
        return;
      }
    } catch {}
    writeCookie(lang);
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    writeCookie(next);
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
