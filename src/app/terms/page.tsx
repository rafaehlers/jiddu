import type { Metadata } from "next";
import { PolicyPageBody } from "@/components/policy-page-body";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { publicPageMetadata } from "@/lib/social-metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "Jiddu — terms of service",
  description:
    "The terms that apply to Jiddu's website, accounts, API, MCP tools, Live features, and paid credits.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <SiteHeader variant="guide" />
      <main className="flex-1">
        <PolicyPageBody kind="terms" />
      </main>
      <SiteFooter />
    </>
  );
}
