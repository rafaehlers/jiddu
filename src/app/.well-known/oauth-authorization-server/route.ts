import { workosAuthkitIssuer } from "@/lib/auth-config";

export const dynamic = "force-dynamic";

export async function GET() {
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
  const upstream = await fetch(
    `${issuer}/.well-known/oauth-authorization-server`,
    { cache: "no-store" },
  );
  const body = await upstream.arrayBuffer();
  return new Response(body, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
    },
  });
}
