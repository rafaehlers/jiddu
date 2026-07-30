import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HomeComposer } from "@/components/home-composer";
import { publicPageMetadata } from "@/lib/social-metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "Jiddu — explain a paper",
  description:
    "Upload a paper and Jiddu explains it paragraph by paragraph, at the level you choose — from plain-language to expert.",
  path: "/explain",
});

export default function ExplainPage() {
  return (
    <>
      <SiteHeader variant="home" />
      <main className="flex-1 flex flex-col">
        <HomeComposer initialMode="explain" />
      </main>
      <SiteFooter />
    </>
  );
}
