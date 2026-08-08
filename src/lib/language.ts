import type { Lang } from "@/lib/fallacies";

const SUPPORTED_LANGUAGES = new Set<Lang>(["en", "pt", "es"]);

/**
 * Converts browser locales and model-produced language names into the three
 * language codes supported by the Jiddu interface.
 */
export function normalizeAppLanguage(
  value: unknown,
  fallback: Lang = "en",
): Lang {
  if (typeof value !== "string") return fallback;

  const normalized = value.trim().toLowerCase().replaceAll("_", "-");
  if (!normalized) return fallback;

  const primarySubtag = normalized.split("-", 1)[0] as Lang;
  if (SUPPORTED_LANGUAGES.has(primarySubtag)) return primarySubtag;

  const searchable = normalized
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (/\b(portuguese|portugues)\b/.test(searchable)) return "pt";
  if (/\b(spanish|espanol|castilian|castelhano)\b/.test(searchable)) return "es";
  if (/\b(english|ingles)\b/.test(searchable)) return "en";

  return fallback;
}
