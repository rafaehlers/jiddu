import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HowItWorksBody } from "@/components/how-it-works-body";

export const metadata: Metadata = {
  title: "Jiddu — how it works",
  description:
    "Technical walkthrough of every Jiddu pipeline: input ingestion, model routing, the three analyses (fallacy / fact-check / neutrality), caching, rate limits, feedback loop, and open-source / methodology references.",
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
