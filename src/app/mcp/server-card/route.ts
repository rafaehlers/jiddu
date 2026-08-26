import {
  legacyMcpServerCardRedirect,
  publicDiscoveryOptionsResponse,
} from "@/lib/mcp-public-metadata";

export function GET() {
  return legacyMcpServerCardRedirect();
}

export const OPTIONS = publicDiscoveryOptionsResponse;
