import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ApiAccessBody } from "@/components/api-access-body";

export const metadata: Metadata = {
  title: "Jiddu — API & MCP",
  description:
    "Use Jiddu's text-analysis tools and asynchronous adversarial PDF reviews from code or an MCP agent.",
};

export default function ApiAccessPage() {
  return (
    <>
      <SiteHeader variant="guide" />
      <main className="flex-1 flex flex-col">
        <ApiAccessBody />
      </main>
      <SiteFooter />
    </>
  );
}
