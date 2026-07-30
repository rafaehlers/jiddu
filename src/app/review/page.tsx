import type { Metadata } from "next";
import { HomeComposer } from "@/components/home-composer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { publicPageMetadata } from "@/lib/social-metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "Jiddu — adversarial paper review",
  description:
    "Upload one final paper PDF for a complete adversarial pre-submission review with localized findings and a published-literature check.",
  path: "/review",
});

export default function ReviewPage() {
  return (
    <>
      <SiteHeader variant="home" />
      <main className="flex-1 flex flex-col">
        <HomeComposer initialMode="review" />
      </main>
      <SiteFooter />
    </>
  );
}
