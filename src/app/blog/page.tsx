import type { Metadata } from "next";
import { BlogIndex } from "@/components/blog-index";
import { BLOG_COPY, blogPosts, getBlogPostTranslation } from "@/lib/blog";
import { SITE_URL } from "@/lib/social-metadata";

const BLOG_URL = `${SITE_URL}/blog`;
const englishCopy = BLOG_COPY.en;
const firstPost = getBlogPostTranslation(blogPosts[0], "en");

export const metadata: Metadata = {
  title: "Jiddu Blog — critical reading, AI, and research",
  description: englishCopy.description,
  alternates: { canonical: BLOG_URL },
  openGraph: {
    title: "Jiddu Blog — critical reading, AI, and research",
    description: englishCopy.description,
    url: BLOG_URL,
    siteName: "Jiddu",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: `${SITE_URL}${blogPosts[0].image.src}`,
        width: blogPosts[0].image.width,
        height: blogPosts[0].image.height,
        type: "image/jpeg",
        alt: firstPost.imageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jiddu Blog — critical reading, AI, and research",
    description: englishCopy.description,
    images: [`${SITE_URL}${blogPosts[0].image.src}`],
  },
};

export default function BlogPage() {
  return <BlogIndex />;
}
