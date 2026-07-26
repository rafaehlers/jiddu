import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ApiAccessBody } from "@/components/api-access-body";

export const metadata: Metadata = {
  title: "Jiddu — API & MCP",
  description:
    "Use Jiddu's five public text-analysis tools from code or an agent, and understand why adversarial PDF review remains a web-only workflow for now.",
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
