import {
  mcpServerCardResponse,
  publicDiscoveryOptionsResponse,
} from "@/lib/mcp-public-metadata";

export function GET(request: Request) {
  return mcpServerCardResponse(request);
}

export const OPTIONS = publicDiscoveryOptionsResponse;
