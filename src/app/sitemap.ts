import type { MetadataRoute } from "next";
import { blogPosts, blogTags } from "@/lib/blog";

const BASE_URL = "https://jiddu.app";

// Demo analyses are stable, seeded ids (scripts/seed-*.mjs) — one per
// pipeline per locale — so they're safe to enumerate. Arbitrary /a/[id] etc.
// are NOT listed here: those are user-submitted analyses shared "unlisted by
// URL" (see /privacy §5 — "anyone with the URL can view it"), and
// enumerating them in a public sitemap would defeat that expectation.
const DEMO_PREFIXES = ["a", "f", "n", "e", "s"] as const;
const LANGS = ["en", "pt", "es"] as const;

// No `lastModified` on any entry: we don't track real per-page revision
// dates, and stamping today's date on every build would be a fabricated
// signal search engines are told to ignore anyway — omitting it is more
// honest than faking it.
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/factcheck`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/neutrality`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/explain`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/slop`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/review`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/live`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/context`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/fallacies`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/slop-patterns`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/how-it-works`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/pricing`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/developers`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/about`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/extension`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/extension/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/benchmark`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/legal`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const blogPages: MetadataRoute.Sitemap = [
    ...blogPosts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(`${post.updatedAt}T12:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...blogTags.map((tag) => ({
      url: `${BASE_URL}/blog/tag/${tag.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];

  const demoPages: MetadataRoute.Sitemap = DEMO_PREFIXES.flatMap((prefix) =>
    LANGS.map((lang) => ({
      url: `${BASE_URL}/${prefix}/demo-${lang}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  );

  return [...staticPages, ...blogPages, ...demoPages];
}
