import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostView } from "@/components/blog-post-view";
import {
  blogPosts,
  getBlogPost,
  getBlogPostTranslation,
  getBlogTag,
  getBlogTagTranslation,
} from "@/lib/blog";
import { SITE_URL } from "@/lib/social-metadata";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  const content = getBlogPostTranslation(post, "en");
  const tagLabels = post.tags.flatMap((tagSlug) => {
    const tag = getBlogTag(tagSlug);
    return tag ? [getBlogTagTranslation(tag, "en").label] : [];
  });
  const url = `${SITE_URL}/blog/${post.slug}`;
  const imageUrl = `${SITE_URL}${post.image.src}`;

  return {
    title: content.seoTitle,
    description: content.description,
    keywords: tagLabels,
    authors: [{ name: post.author, url: SITE_URL }],
    alternates: { canonical: url },
    openGraph: {
      title: content.title,
      description: content.description,
      url,
      siteName: "Jiddu",
      type: "article",
      locale: "en_US",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      tags: tagLabels,
      images: [
        {
          url: imageUrl,
          width: post.image.width,
          height: post.image.height,
          type: "image/jpeg",
          alt: content.imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: content.title,
      description: content.description,
      images: [imageUrl],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return <BlogPostView post={post} />;
}
