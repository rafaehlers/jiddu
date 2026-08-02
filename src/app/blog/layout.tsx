import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader variant="guide" />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
