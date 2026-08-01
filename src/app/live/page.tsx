import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LivePage } from "@/components/live/live-page";
import { publicPageMetadata } from "@/lib/social-metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "Jiddu Live — real-time critical analysis",
  description:
    "Detect logical fallacies, check-worthy claims and neutrality signals as the speaker talks through a microphone or browser tab.",
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
