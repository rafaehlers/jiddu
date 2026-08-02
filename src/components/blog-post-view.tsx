"use client";

import Image from "next/image";
import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { JsonLd } from "@/components/json-ld";
import type { BlogPost } from "@/lib/blog";
import {
  BLOG_COPY,
  blogLanguageTag,
  formatBlogDate,
  getBlogPostTranslation,
  getBlogTag,
  getBlogTagTranslation,
} from "@/lib/blog";
import { useI18n } from "@/lib/i18n/provider";
import { SITE_URL } from "@/lib/social-metadata";

const markdownComponents: Components = {
  h2: ({ children }) => (
    <h2 className="mt-10 scroll-mt-20 font-serif text-2xl leading-tight sm:text-3xl">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-8 font-serif text-xl leading-tight sm:text-2xl">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mt-5 text-[1.0625rem] leading-8 text-foreground/90">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="mt-5 list-disc space-y-2 pl-6 text-[1.0625rem] leading-8 text-foreground/90">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-5 list-decimal space-y-3 pl-6 text-[1.0625rem] leading-8 text-foreground/90">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-8 border-l-2 border-accent-hi bg-paper px-5 py-1 font-serif text-xl italic leading-relaxed text-foreground">
      {children}
    </blockquote>
  ),
  a: ({ href = "", children }) => {
    const className =
      "text-accent-hi underline decoration-rule underline-offset-4 transition-colors hover:text-foreground";
    if (href.startsWith("/")) {
      return (
        <Link href={href} className={className}>
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  },
};

export function BlogPostView({ post }: { post: BlogPost }) {
  const { lang } = useI18n();
  const copy = BLOG_COPY[lang];
  const content = getBlogPostTranslation(post, lang);
  const localizedTags = post.tags.flatMap((tagSlug) => {
    const tag = getBlogTag(tagSlug);
    return tag ? [{ tag, content: getBlogTagTranslation(tag, lang) }] : [];
  });
  const url = `${SITE_URL}/blog/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        url,
        headline: content.title,
        description: content.description,
        image: {
          "@type": "ImageObject",
          url: `${SITE_URL}${post.image.src}`,
          width: post.image.width,
          height: post.image.height,
        },
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        inLanguage: blogLanguageTag(lang),
        author: { "@type": "Organization", name: post.author, url: SITE_URL },
        publisher: {
          "@type": "Organization",
          name: "Jiddu",
          url: SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/brand/jiddu_logo.png`,
          },
        },
        keywords: localizedTags.map(({ content: tag }) => tag.label).join(", "),
        isPartOf: { "@id": `${SITE_URL}/blog#blog` },
        citation: [
          "https://arxiv.org/abs/2604.13940",
          `${SITE_URL}/how-it-works`,
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Jiddu",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: `${SITE_URL}/blog`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: content.title,
            item: url,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: content.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  return (
    <article
      lang={blogLanguageTag(lang)}
      className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12"
    >
      <JsonLd data={jsonLd} />
      <div className="w-full">
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted">
          <Link
            href="/blog"
            className="underline decoration-rule underline-offset-4 transition-colors hover:text-foreground"
          >
            Blog
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span>{copy.articleBreadcrumb}</span>
        </nav>

        <header className="space-y-5">
          <h1 className="text-balance font-serif text-4xl leading-[1.08] sm:text-5xl">
            {content.title}
          </h1>
          <p className="text-lg leading-relaxed text-muted sm:text-xl">
            {content.excerpt}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-rule pt-5 text-sm text-muted">
            <span>
              {copy.by} {post.author}
            </span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.publishedAt}>
              {formatBlogDate(post.publishedAt, lang)}
            </time>
            <span aria-hidden="true">·</span>
            <span>{content.readingTime}</span>
          </div>
        </header>
      </div>

      <figure className="my-8 overflow-hidden rounded-xl border border-rule bg-paper sm:my-10">
        <Image
          src={post.image.src}
          alt={content.imageAlt}
          width={post.image.width}
          height={post.image.height}
          sizes="(min-width: 1024px) 976px, calc(100vw - 2rem)"
          className="h-auto w-full"
          priority
        />
        <figcaption className="border-t border-rule px-4 py-3 text-center text-xs leading-relaxed text-muted">
          {content.imageCaption}
        </figcaption>
      </figure>

      <div className="w-full">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {content.body}
        </ReactMarkdown>

        <section
          aria-labelledby="faq-title"
          className="mt-12 border-t border-rule pt-10"
        >
          <h2 id="faq-title" className="font-serif text-2xl sm:text-3xl">
            {copy.faqTitle}
          </h2>
          <dl className="mt-6 divide-y divide-rule border-y border-rule">
            {content.faq.map((item) => (
              <div key={item.question} className="py-5">
                <dt className="font-serif text-lg font-semibold">
                  {item.question}
                </dt>
                <dd className="mt-2 text-base leading-relaxed text-muted">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <aside className="mt-12 rounded-xl border border-rule bg-paper p-6 sm:p-8">
          <p className="font-serif text-2xl">{copy.ctaTitle}</p>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted">
            {copy.ctaDescription}
          </p>
          <Link
            href="/review"
            className="mt-5 inline-flex rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            {copy.ctaLabel}
          </Link>
        </aside>

        <footer className="mt-10 border-t border-rule pt-6">
          <p className="text-sm font-medium text-foreground">{copy.tagsTitle}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {localizedTags.map(({ tag, content: tagContent }) => (
              <Link
                key={tag.slug}
                href={`/blog/tag/${tag.slug}`}
                className="rounded-full border border-rule bg-paper px-3 py-1 text-xs text-muted transition-colors hover:border-accent-edge hover:text-foreground"
              >
                {tagContent.label}
              </Link>
            ))}
          </div>
        </footer>
      </div>
    </article>
  );
}
