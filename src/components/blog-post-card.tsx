"use client";

import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/lib/blog";
import {
  BLOG_COPY,
  formatBlogDate,
  getBlogPostTranslation,
} from "@/lib/blog";
import { useI18n } from "@/lib/i18n/provider";

export function BlogPostCard({
  post,
  priority = false,
}: {
  post: BlogPost;
  priority?: boolean;
}) {
  const { lang } = useI18n();
  const content = getBlogPostTranslation(post, lang);
  const copy = BLOG_COPY[lang];

  return (
    <article className="group overflow-hidden rounded-xl border border-rule bg-paper">
      <Link
        href={`/blog/${post.slug}`}
        className="relative block aspect-[1.905/1] overflow-hidden border-b border-rule"
        aria-label={`${copy.readArticle}: ${content.title}`}
      >
        <Image
          src={post.image.src}
          alt={content.imageAlt}
          fill
          sizes="(min-width: 1024px) 928px, calc(100vw - 3rem)"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.015]"
          priority={priority}
        />
      </Link>
      <div className="flex flex-col gap-4 p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs text-muted">
          <time dateTime={post.publishedAt}>
            {formatBlogDate(post.publishedAt, lang)}
          </time>
          <span aria-hidden="true">·</span>
          <span>{content.readingTime}</span>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="font-serif text-2xl leading-tight sm:text-3xl">
            <Link
              href={`/blog/${post.slug}`}
              className="transition-colors hover:text-accent-hi"
            >
              {content.title}
            </Link>
          </h2>
          <p className="max-w-3xl text-base leading-relaxed text-muted">
            {content.excerpt}
          </p>
        </div>
        <Link
          href={`/blog/${post.slug}`}
          className="w-fit text-sm font-medium text-accent-hi underline decoration-rule underline-offset-4 transition-colors hover:text-foreground"
        >
          {copy.readArticle} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
