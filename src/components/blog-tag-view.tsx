"use client";

import Link from "next/link";
import { BlogPostCard } from "@/components/blog-post-card";
import { JsonLd } from "@/components/json-ld";
import type { BlogTag } from "@/lib/blog";
import {
  BLOG_COPY,
  blogLanguageTag,
  getBlogPostTranslation,
  getBlogPostsByTag,
  getBlogTagTranslation,
} from "@/lib/blog";
import { useI18n } from "@/lib/i18n/provider";
import { SITE_URL } from "@/lib/social-metadata";

export function BlogTagView({ tag }: { tag: BlogTag }) {
  const { lang } = useI18n();
  const copy = BLOG_COPY[lang];
  const tagContent = getBlogTagTranslation(tag, lang);
  const posts = getBlogPostsByTag(tag.slug);
  const url = `${SITE_URL}/blog/tag/${tag.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    url,
    name: `${tagContent.label} — ${copy.name}`,
    description: tagContent.description,
    inLanguage: blogLanguageTag(lang),
    isPartOf: { "@id": `${SITE_URL}/blog#blog` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}/blog/${post.slug}`,
        name: getBlogPostTranslation(post, lang).title,
      })),
    },
  };

  return (
    <section
      lang={blogLanguageTag(lang)}
      className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-16"
    >
      <JsonLd data={jsonLd} />
      <header className="max-w-3xl space-y-4">
        <Link
          href="/blog"
          className="text-sm text-muted underline decoration-rule underline-offset-4 transition-colors hover:text-foreground"
        >
          <span aria-hidden="true">←</span> {copy.allArticles}
        </Link>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent-hi">
          {copy.tagEyebrow}
        </p>
        <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
          {tagContent.label}
        </h1>
        <p className="text-base leading-relaxed text-muted sm:text-lg">
          {tagContent.description}
        </p>
      </header>

      <div className="flex flex-col gap-8">
        {posts.map((post, index) => (
          <BlogPostCard key={post.slug} post={post} priority={index === 0} />
        ))}
      </div>
    </section>
  );
}
