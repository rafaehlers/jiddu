"use client";

import { useI18n } from "@/lib/i18n/provider";
import { LANG_NAMES } from "@/lib/i18n/messages";
import type { Lang } from "@/lib/fallacies";

export function LangSelector() {
  const { lang, setLang } = useI18n();
  return (
    <label className="inline-flex items-center text-sm">
      <span className="sr-only">Language</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        className="bg-transparent border border-rule rounded-md px-2 py-1 hover:border-foreground transition-colors cursor-pointer"
        aria-label="Language"
      >
        {(Object.keys(LANG_NAMES) as Lang[]).map((l) => (
          <option key={l} value={l}>
            {LANG_NAMES[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
