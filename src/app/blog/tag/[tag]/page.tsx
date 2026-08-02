import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogTagView } from "@/components/blog-tag-view";
import {
  blogPosts,
  blogTags,
  getBlogPostTranslation,
  getBlogTag,
  getBlogTagTranslation,
} from "@/lib/blog";
import { SITE_URL } from "@/lib/social-metadata";

type Props = {
  params: Promise<{ tag: string }>;
};

export function generateStaticParams() {
  return blogTags.map((tag) => ({ tag: tag.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag: tagSlug } = await params;
  const tag = getBlogTag(tagSlug);
  if (!tag) return {};

  const tagContent = getBlogTagTranslation(tag, "en");
  const firstPost = getBlogPostTranslation(blogPosts[0], "en");
  const url = `${SITE_URL}/blog/tag/${tag.slug}`;
  const title = `${tagContent.label} — Jiddu Blog`;
  return {
    title,
    description: tagContent.description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: tagContent.description,
      url,
      siteName: "Jiddu",
      type: "website",
      locale: "en_US",
      images: [
        {
          url: `${SITE_URL}${blogPosts[0].image.src}`,
          width: blogPosts[0].image.width,
          height: blogPosts[0].image.height,
          alt: firstPost.imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: tagContent.description,
      images: [`${SITE_URL}${blogPosts[0].image.src}`],
    },
  };
}

export default async function BlogTagPage({ params }: Props) {
  const { tag: tagSlug } = await params;
  const tag = getBlogTag(tagSlug);
  if (!tag) notFound();

  return <BlogTagView tag={tag} />;
}
