import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ApiAccessBody } from "@/components/api-access-body";

export const metadata: Metadata = {
  title: "Jiddu — API & MCP",
  description:
    "Use Jiddu's fallacy detector, fact-check, neutrality assessment and paper explainer from your own code or agent — a documented REST API and an MCP server.",
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
