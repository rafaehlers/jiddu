import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ExplainComposer } from "@/components/explain-composer";

export const metadata: Metadata = {
  title: "Jiddu — explain a paper",
  description:
    "Upload a paper and Jiddu explains it paragraph by paragraph, at the level you choose — from plain-language to expert.",
};

export default function ExplainPage() {
  return (
    <>
      <SiteHeader variant="home" />
      <main className="flex-1 flex flex-col">
        <ExplainComposer />
      </main>
      <SiteFooter />
    </>
  );
}
