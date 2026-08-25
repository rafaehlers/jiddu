import { JIDDU_MCP_REGISTRY_MANIFEST } from "@/lib/mcp-public-metadata";

export const dynamic = "force-static";

export function GET() {
  return Response.json(JIDDU_MCP_REGISTRY_MANIFEST, {
    headers: { "cache-control": "public, max-age=300" },
  });
}
