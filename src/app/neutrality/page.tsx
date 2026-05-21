import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { NeutralityComposer } from "@/components/neutrality-composer";

export const metadata: Metadata = {
  title: "Jiddu — neutrality assessment",
  description:
    "Detect framing, attribution and source-selection patterns in any text — without classifying partisan direction.",
};

export default function NeutralityPage() {
  return (
    <>
      <SiteHeader variant="home" />
      <main className="flex-1 flex flex-col">
        <NeutralityComposer />
      </main>
      <SiteFooter />
    </>
  );
}
