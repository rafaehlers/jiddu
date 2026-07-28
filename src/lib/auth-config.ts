export function isWorkOSConfigured(): boolean {
  return Boolean(
    process.env.WORKOS_API_KEY &&
      process.env.WORKOS_CLIENT_ID &&
      process.env.WORKOS_COOKIE_PASSWORD &&
      process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
  );
}

export function workosAuthkitIssuer(): string | null {
  const configured = process.env.WORKOS_AUTHKIT_DOMAIN?.trim();
  if (!configured) return null;
  try {
    const url = new URL(configured);
    if (url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function mcpResourceUrl(requestUrl?: string): string {
  const configured = process.env.MCP_RESOURCE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return `${appBaseUrl(requestUrl)}/api/mcp`;
}

export function appBaseUrl(requestUrl?: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (requestUrl) return new URL(requestUrl).origin;
  return "http://localhost:3000";
}
