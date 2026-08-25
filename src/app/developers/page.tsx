import type { Metadata } from "next";
import { ApiAccessBody } from "@/components/api-access-body";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { publicPageMetadata } from "@/lib/social-metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "Jiddu Developer Docs — REST API, OpenAPI & MCP",
  description:
    "Integrate Jiddu's critical-reading tools through REST or Streamable HTTP MCP, with OpenAPI schemas, OAuth discovery, quickstarts, limits, and structured responses.",
  path: "/developers",
});

export default function DevelopersPage() {
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
