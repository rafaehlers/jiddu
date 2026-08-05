import type { Metadata } from "next";
import { PolicyPageBody } from "@/components/policy-page-body";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { publicPageMetadata } from "@/lib/social-metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "Jiddu — privacy policy",
  description:
    "How Jiddu handles account data, submitted content, payments, analytics, and service usage.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader variant="guide" />
      <main className="flex-1">
        <PolicyPageBody kind="privacy" />
      </main>
      <SiteFooter />
    </>
  );
}
