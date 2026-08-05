import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LegalBody } from "@/components/legal-body";
import { publicPageMetadata } from "@/lib/social-metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "Jiddu — legal notices and disclaimers",
  description:
    "Automated-analysis limitations, methodology, confidential-paper guidance, and legal notices for Jiddu.",
  path: "/legal",
});

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
