import type { Metadata } from "next";
import { HomeComposer } from "@/components/home-composer";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  publicPageMetadata,
  SITE_DESCRIPTION,
} from "@/lib/social-metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "Jiddu — truth is a pathless land",
  description: SITE_DESCRIPTION,
  path: "/",
});

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <SiteHeader showLogo={false} />
      <HomeComposer initialMode="detector" />
      <SiteFooter />
    </main>
  );
}
