import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HomeComposer } from "@/components/home-composer";
import { publicPageMetadata } from "@/lib/social-metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "Jiddu — neutrality assessment",
  description:
    "Detect framing, attribution and source-selection patterns in any text — without classifying partisan direction.",
  path: "/neutrality",
});

export default function NeutralityPage() {
  return (
    <>
      <SiteHeader variant="home" />
      <main className="flex-1 flex flex-col">
        <HomeComposer initialMode="neutrality" />
      </main>
      <SiteFooter />
    </>
  );
}
