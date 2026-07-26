import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LegalBody } from "@/components/legal-body";

export const metadata: Metadata = {
  title: "Jiddu — terms and disclaimers",
  description:
    "Terms, privacy notes and automated-analysis disclaimers for Jiddu, including confidential-paper and adversarial-review guidance.",
};

export default function LegalPage() {
  return (
    <>
      <SiteHeader variant="guide" />
      <main className="flex-1">
        <LegalBody />
      </main>
      <SiteFooter />
    </>
  );
}
