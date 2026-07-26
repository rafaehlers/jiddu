import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HomeComposer } from "@/components/home-composer";

export const metadata: Metadata = {
  title: "Jiddu — AI-slop detector",
  description:
    "Flag the stock phrasing, manufactured drama and templated structures that make text read as machine-assembled — pattern by pattern, with quotes to check.",
};

export default function SlopPage() {
  return (
    <>
      <SiteHeader variant="home" />
      <main className="flex-1 flex flex-col">
        <HomeComposer initialMode="slop" />
      </main>
      <SiteFooter />
    </>
  );
}
