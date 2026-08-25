import type { Metadata } from "next";
import { HomeComposer } from "@/components/home-composer";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { blogPosts } from "@/lib/blog";
import {
  publicPageMetadata,
  SITE_DESCRIPTION,
  SITE_TITLE,
} from "@/lib/social-metadata";
import { HOME_JSON_LD } from "@/lib/site-json-ld";

const latestBlogPosts = blogPosts.slice(0, 2).map((post) => ({
  slug: post.slug,
  translations: {
    en: {
      title: post.translations.en.title,
      excerpt: post.translations.en.excerpt,
    },
    pt: {
      title: post.translations.pt.title,
      excerpt: post.translations.pt.excerpt,
    },
    es: {
      title: post.translations.es.title,
      excerpt: post.translations.es.excerpt,
    },
  },
}));

export const metadata: Metadata = publicPageMetadata({
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  path: "/",
});

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <JsonLd data={HOME_JSON_LD} />
      <SiteHeader />
      <HomeComposer
        initialMode="detector"
        showOriginNote
        showSignupCta
        latestBlogPosts={latestBlogPosts}
      />
      <SiteFooter />
    </main>
  );
}
