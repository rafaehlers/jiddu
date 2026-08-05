import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LivePage } from "@/components/live/live-page";
import { publicPageMetadata } from "@/lib/social-metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "Jiddu Live — real-time critical analysis",
  description:
    "Follow topics, explain unfamiliar terms and detect logical fallacies, check-worthy claims and neutrality signals as someone speaks.",
  path: "/live",
});

export default function LiveRoute() {
  return (
    <main className="flex-1 flex flex-col">
      <SiteHeader variant="viewer" />
      <LivePage />
      <SiteFooter />
    </main>
  );
}
