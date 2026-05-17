import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LivePage } from "@/components/live/live-page";

export const metadata: Metadata = {
  title: "Jiddu Live — real-time fallacy detection",
  description:
    "Detect logical fallacies as the speaker talks. Capture your microphone or a browser tab and watch the analysis surface in real time.",
  robots: { index: false, follow: false },
};

export default function LiveRoute() {
  return (
    <main className="flex-1 flex flex-col">
      <SiteHeader variant="viewer" />
      <LivePage />
      <SiteFooter />
    </main>
  );
}
