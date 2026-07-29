"use client";

import { useI18n } from "@/lib/i18n/provider";
import { LANG_NAMES } from "@/lib/i18n/messages";
import type { Lang } from "@/lib/fallacies";

const LANG_FLAGS: Record<Lang, string> = {
  en: "🇬🇧",
  pt: "🇧🇷",
  es: "🇪🇸",
};

export function LangSelector() {
  const { lang, setLang } = useI18n();
  const currentLanguage = LANG_NAMES[lang];
  return (
    <label className="inline-flex items-center text-sm">
      <span className="sr-only">Language</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        className="w-14 bg-transparent border border-rule rounded-md px-2 py-1 text-center hover:border-foreground transition-colors cursor-pointer"
        aria-label={`Language: ${currentLanguage}`}
        title={currentLanguage}
      >
        {(Object.keys(LANG_NAMES) as Lang[]).map((l) => (
          <option
            key={l}
            value={l}
            aria-label={LANG_NAMES[l]}
            title={LANG_NAMES[l]}
          >
            {LANG_FLAGS[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
