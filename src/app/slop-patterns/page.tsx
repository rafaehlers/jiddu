import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SlopGuide } from "@/components/slop-guide";
import { publicPageMetadata } from "@/lib/social-metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "Jiddu — slop pattern guide",
  description:
    "A short reference for the AI-slop writing patterns Jiddu can flag — stock phrasing, manufactured drama, templated structures, hollow substance, and format tics.",
  path: "/slop-patterns",
});

export default function SlopPatternsPage() {
  return (
    <>
      <SiteHeader variant="guide" />
      <main className="flex-1">
        <SlopGuide />
      </main>
      <SiteFooter />
    </>
  );
}
