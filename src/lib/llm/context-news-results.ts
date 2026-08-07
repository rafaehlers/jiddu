export const MAX_CONTEXT_NEWS_LINKS = 2;

export type ContextNewsResult = {
  title: string;
  url: string;
  publisher: string;
  summary: string | null;
};

type UrlCitationAnnotation = {
  url_citation?: {
    url?: string | null;
    title?: string | null;
  } | null;
};

export function extractContextNews(
  annotations: readonly UrlCitationAnnotation[] | null | undefined,
  summary: string | null,
): ContextNewsResult[] {
  const results: ContextNewsResult[] = [];
  const seen = new Set<string>();
  for (const annotation of annotations ?? []) {
    if (results.length >= MAX_CONTEXT_NEWS_LINKS) break;
    const rawUrl = annotation.url_citation?.url?.trim();
    if (!rawUrl) continue;
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      continue;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") continue;
    url.hash = "";
    const canonicalUrl = url.toString();
    if (seen.has(canonicalUrl)) continue;
    seen.add(canonicalUrl);
    const publisher = url.hostname.replace(/^www\./, "").slice(0, 160);
    results.push({
      title: (annotation.url_citation?.title?.trim() || publisher).slice(0, 300),
      url: canonicalUrl,
      publisher,
      summary,
    });
  }
  return results;
}
