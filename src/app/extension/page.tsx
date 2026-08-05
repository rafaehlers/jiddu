import type { Metadata } from "next";
import { ExtensionLanding } from "@/components/extension-landing";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { publicPageMetadata } from "@/lib/social-metadata";

const CHROME_WEB_STORE_URL =
  "https://chromewebstore.google.com/detail/jiddu-%E2%80%94-critical-reading/mjkfmfofghefpealomfibajfofoebnee";

export const metadata: Metadata = publicPageMetadata({
  title: "Jiddu for Chrome — critical reading on any page",
  description:
    "Select a passage on any website and analyze its fallacies, factual claims, or bias with the Jiddu Chrome extension.",
  path: "/extension",
});

export default function ExtensionPage() {
  const configuredUrl = process.env.NEXT_PUBLIC_CHROME_WEB_STORE_URL?.trim();
  const storeUrl = configuredUrl?.startsWith(
    "https://chromewebstore.google.com/",
  )
    ? configuredUrl
    : CHROME_WEB_STORE_URL;

  return (
    <>
      <SiteHeader variant="guide" />
      <main className="flex-1">
        <ExtensionLanding storeUrl={storeUrl} />
      </main>
      <SiteFooter />
    </>
  );
}
