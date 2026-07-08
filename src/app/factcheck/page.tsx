import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HomeComposer } from "@/components/home-composer";

export const metadata: Metadata = {
  title: "Jiddu — fact-check",
  description:
    "Extract verifiable factual claims from any text — numbers, dates, quotes, causal and categorical assertions. The first step toward fact-checking.",
};

export default function FactCheckPage() {
  return (
    <>
      <SiteHeader variant="home" />
      <main className="flex-1 flex flex-col">
        <HomeComposer initialMode="factcheck" />
      </main>
      <SiteFooter />
    </>
  );
}
