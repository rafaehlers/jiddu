import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FallaciesGuide } from "@/components/fallacies-guide";
import { publicPageMetadata } from "@/lib/social-metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "Fallacy guide · Jiddu",
  description:
    "A short reference for the logical and rhetorical fallacies Jiddu can detect.",
  path: "/fallacies",
});

export default function FallaciesPage() {
  return (
    <main className="flex-1 flex flex-col">
      <SiteHeader variant="guide" />
      <FallaciesGuide />
      <SiteFooter />
    </main>
  );
}
