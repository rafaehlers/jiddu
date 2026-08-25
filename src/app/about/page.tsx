import type { Metadata } from "next";
import { AboutBody } from "@/components/about-body";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { publicPageMetadata } from "@/lib/social-metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "About Jiddu — Critical Reading for People and Agents",
  description:
    "Who operates Jiddu, what its critical-reading tools do, how the product is built, and the limits of its automated analyses.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <SiteHeader variant="guide" />
      <main className="flex-1">
        <AboutBody />
      </main>
      <SiteFooter />
    </>
  );
}
