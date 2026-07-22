import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { NotFoundBody } from "@/components/not-found-body";

export const metadata: Metadata = {
  title: "Jiddu — page not found",
};

export default function NotFound() {
  return (
    <>
      <SiteHeader variant="guide" />
      <main className="flex-1 flex flex-col">
        <NotFoundBody />
      </main>
      <SiteFooter />
    </>
  );
}
