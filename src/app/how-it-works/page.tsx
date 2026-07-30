import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HowItWorksBody } from "@/components/how-it-works-body";
import { publicPageMetadata } from "@/lib/social-metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "Jiddu — how it works",
  description:
    "Technical walkthrough of Jiddu's pipelines, credit billing, LiteParse PDF ingestion, venue-calibrated adversarial paper review, model routing, privacy, rate limits, and methodology.",
  path: "/how-it-works",
});

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader variant="guide" />
      <main className="flex-1">
        <HowItWorksBody />
      </main>
      <SiteFooter />
    </>
  );
}
