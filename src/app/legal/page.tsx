import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LegalBody } from "@/components/legal-body";

export const metadata: Metadata = {
  title: "Jiddu — terms and disclaimers",
  description:
    "Terms of use, automated-analysis disclaimer and privacy notes for Jiddu.",
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
