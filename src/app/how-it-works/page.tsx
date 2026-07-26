import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HowItWorksBody } from "@/components/how-it-works-body";

export const metadata: Metadata = {
  title: "Jiddu — how it works",
  description:
    "Technical walkthrough of all six Jiddu pipelines, including LiteParse PDF ingestion, venue-calibrated adversarial paper review, model routing, privacy, rate limits, and methodology.",
};

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
