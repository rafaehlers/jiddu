import "server-only";

import {
  mcpResourceUrl,
  workosAuthkitIssuer,
} from "@/lib/auth-config";

export function protectedResourceMetadata(
  requestUrl: string,
): Response {
  const issuer = workosAuthkitIssuer();
  if (!issuer) {
    return Response.json(
      {
        error: "WorkOS MCP authorization is not configured.",
        code: "mcp_auth_not_configured",
      },
      { status: 503 },
    );
  }
  return Response.json(
    {
      resource: mcpResourceUrl(requestUrl),
      resource_name: "Jiddu Critical Reading MCP",
      resource_documentation: "https://jiddu.app/developers",
      authorization_servers: [issuer],
      scopes_supported: ["openid", "profile", "email", "offline_access"],
      bearer_methods_supported: ["header"],
    },
    { headers: { "cache-control": "no-store" } },
  );
}
