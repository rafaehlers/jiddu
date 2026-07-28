import "server-only";

import { WorkOS, type User } from "@workos-inc/node";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { effectiveAnalysisAccessMode } from "@/lib/analysis-access";
import {
  appBaseUrl,
  mcpResourceUrl,
  workosAuthkitIssuer,
} from "@/lib/auth-config";

export type McpUserContext = {
  id: string;
  userId: string;
  email: string;
  apiKey: string;
  billing: "platform" | "jiddu";
};

let cachedIssuer: string | null = null;
let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;
const userCache = new Map<string, { user: User; expiresAt: number }>();
const USER_CACHE_MS = 5 * 60 * 1000;

function jwksFor(issuer: string) {
  if (!cachedJwks || cachedIssuer !== issuer) {
    cachedIssuer = issuer;
    cachedJwks = createRemoteJWKSet(new URL(`${issuer}/oauth2/jwks`));
  }
  return cachedJwks;
}

async function getWorkOSUser(userId: string): Promise<User> {
  const cached = userCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.user;
  const apiKey = process.env.WORKOS_API_KEY;
  if (!apiKey) throw new Error("WORKOS_API_KEY is not configured");
  const user = await new WorkOS(apiKey).userManagement.getUser(userId);
  userCache.set(userId, { user, expiresAt: Date.now() + USER_CACHE_MS });
  return user;
}

export function protectedResourceMetadataUrl(requestUrl: string): string {
  return `${appBaseUrl(requestUrl)}/.well-known/oauth-protected-resource`;
}

export function mcpWwwAuthenticate(requestUrl: string): string {
  return [
    'Bearer error="unauthorized"',
    'error_description="Authorization needed"',
    `resource_metadata="${protectedResourceMetadataUrl(requestUrl)}"`,
  ].join(", ");
}

export async function requireMcpUser(
  request: Request,
): Promise<McpUserContext | Response> {
  const issuer = workosAuthkitIssuer();
  if (!issuer) {
    return jsonError(
      "WorkOS MCP authorization is not configured.",
      503,
      "mcp_auth_not_configured",
    );
  }

  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return unauthorized(request, "No bearer token provided.");

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, jwksFor(issuer), {
      issuer,
      audience: mcpResourceUrl(request.url),
    });
    if (typeof payload.sub !== "string" || !payload.sub) {
      return unauthorized(request, "Token does not identify a user.");
    }
    userId = payload.sub;
  } catch {
    return unauthorized(request, "Invalid or expired bearer token.");
  }

  try {
    const user = await getWorkOSUser(userId);
    if (!user.emailVerified) {
      return jsonError(
        "Verify your account email before using Jiddu MCP.",
        403,
        "email_verification_required",
      );
    }
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return jsonError(
        "Platform analysis access is temporarily unavailable.",
        503,
        "platform_key_unavailable",
      );
    }
    return {
      id: userId,
      userId,
      email: user.email,
      apiKey,
      billing:
        (await effectiveAnalysisAccessMode(user)) === "platform"
          ? "platform"
          : "jiddu",
    };
  } catch {
    return jsonError(
      "Could not resolve this WorkOS account.",
      503,
      "identity_lookup_failed",
    );
  }
}

function unauthorized(request: Request, message: string): Response {
  return new Response(
    JSON.stringify({ error: message, code: "unauthorized" }),
    {
      status: 401,
      headers: {
        "content-type": "application/json",
        "www-authenticate": mcpWwwAuthenticate(request.url),
      },
    },
  );
}

function jsonError(error: string, status: number, code: string): Response {
  return Response.json({ error, code }, { status });
}
