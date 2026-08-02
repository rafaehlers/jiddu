"use client";

import Link from "next/link";
import { BlogPostCard } from "@/components/blog-post-card";
import { JsonLd } from "@/components/json-ld";
import {
  BLOG_COPY,
  blogLanguageTag,
  blogPosts,
  blogTags,
  getBlogPostsByTag,
  getBlogPostTranslation,
  getBlogTagTranslation,
} from "@/lib/blog";
import { useI18n } from "@/lib/i18n/provider";
import { SITE_URL } from "@/lib/social-metadata";

const BLOG_URL = `${SITE_URL}/blog`;

export function BlogIndex() {
  const { lang } = useI18n();
  const copy = BLOG_COPY[lang];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${BLOG_URL}#blog`,
    url: BLOG_URL,
    name: copy.name,
    description: copy.description,
    inLanguage: blogLanguageTag(lang),
    publisher: {
      "@type": "Organization",
      name: "Jiddu",
      url: SITE_URL,
      logo: `${SITE_URL}/brand/jiddu_logo.png`,
    },
    blogPost: blogPosts.map((post) => {
      const content = getBlogPostTranslation(post, lang);
      return {
        "@type": "BlogPosting",
        "@id": `${SITE_URL}/blog/${post.slug}#article`,
        url: `${SITE_URL}/blog/${post.slug}`,
        headline: content.title,
        description: content.description,
        datePublished: post.publishedAt,
        image: `${SITE_URL}${post.image.src}`,
        inLanguage: blogLanguageTag(lang),
      };
    }),
  };

  return (
    <section
      lang={blogLanguageTag(lang)}
      className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-16"
    >
      <JsonLd data={jsonLd} />
      <header className="max-w-3xl space-y-3">
        <h1 className="font-serif text-4xl leading-tight sm:text-5xl">Blog</h1>
        <p className="text-base leading-relaxed text-muted sm:text-lg">
          {copy.description}
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-8">
          {blogPosts.map((post, index) => (
            <BlogPostCard key={post.slug} post={post} priority={index === 0} />
          ))}
        </div>

        <aside className="border-t border-rule pt-6 lg:sticky lg:top-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <h2 className="font-serif text-xl">{copy.tagsTitle}</h2>
          <nav aria-label={copy.tagsAriaLabel} className="mt-3">
            <ul className="divide-y divide-rule border-y border-rule">
              {blogTags.map((tag) => {
                const tagContent = getBlogTagTranslation(tag, lang);
                const count = getBlogPostsByTag(tag.slug).length;
                const countLabel = `${count} ${
                  count === 1 ? copy.postSingular : copy.postPlural
                }`;
                return (
                  <li key={tag.slug}>
                    <Link
                      href={`/blog/tag/${tag.slug}`}
                      className="flex items-center justify-between gap-3 py-3 text-sm text-muted transition-colors hover:text-foreground"
                    >
                      <span>{tagContent.label}</span>
                      <span
                        aria-label={countLabel}
                        className="inline-flex min-w-6 items-center justify-center rounded-full border border-rule bg-paper px-1.5 py-0.5 text-xs tabular-nums text-muted"
                      >
                        {count}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
      </div>
    </section>
  );
}
