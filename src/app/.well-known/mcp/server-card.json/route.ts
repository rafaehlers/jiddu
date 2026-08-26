import {
  legacyMcpServerCardRedirect,
  publicDiscoveryOptionsResponse,
} from "@/lib/mcp-public-metadata";

export function GET(request: Request) {
  return legacyMcpServerCardRedirect(request.url);
}

export const OPTIONS = publicDiscoveryOptionsResponse;
