import type { Metadata } from "next";
import { ExtensionPrivacyBody } from "@/components/extension-privacy-body";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { publicPageMetadata } from "@/lib/social-metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "Jiddu Chrome extension — privacy policy",
  description:
    "How the Jiddu Chrome extension handles selected website content, API credentials, settings, and analysis results.",
  path: "/extension/privacy",
});

export default function ExtensionPrivacyPage() {
  return (
    <>
      <SiteHeader variant="guide" />
      <main className="flex-1">
        <ExtensionPrivacyBody />
      </main>
      <SiteFooter />
    </>
  );
}
