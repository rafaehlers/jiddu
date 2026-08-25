import { mcpServerCardResponse } from "@/lib/mcp-public-metadata";

export const dynamic = "force-static";

export function GET() {
  return mcpServerCardResponse();
}
