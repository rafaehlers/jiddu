import {
  aiCatalogResponse,
  publicDiscoveryOptionsResponse,
} from "@/lib/mcp-public-metadata";

export function GET(request: Request) {
  return aiCatalogResponse(request);
}

export const OPTIONS = publicDiscoveryOptionsResponse;
