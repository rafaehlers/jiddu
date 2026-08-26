import { createHash } from "node:crypto";

export const JIDDU_MCP_NAME = "app.jiddu/jiddu";
export const JIDDU_MCP_VERSION = "1.0.0";
export const JIDDU_MCP_TITLE = "Jiddu Critical Reading";
export const JIDDU_MCP_DESCRIPTION =
  "Critical-reading tools for text analysis and adversarial PDF review.";
export const JIDDU_MCP_URL = "https://jiddu.app/api/mcp";
export const JIDDU_MCP_SERVER_CARD_PATH = "/api/mcp/server-card";
export const JIDDU_MCP_SERVER_CARD_URL =
  `https://jiddu.app${JIDDU_MCP_SERVER_CARD_PATH}`;
export const JIDDU_AI_CATALOG_URL =
  "https://jiddu.app/.well-known/ai-catalog.json";

const JIDDU_MCP_REMOTES = [
  {
    type: "streamable-http",
    url: JIDDU_MCP_URL,
  },
] as const;

const JIDDU_MCP_ICONS = [
  {
    src: "https://jiddu.app/icon.png",
    mimeType: "image/png",
    sizes: ["256x256"],
  },
] as const;

export const JIDDU_MCP_TOOLS = [
  {
    name: "detect_fallacies",
    title: "Detect fallacies",
    description:
      "Analyze an argument and return each logical fallacy with its exact excerpt and an explanation. Best for 40–2000 characters.",
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
  },
  {
    name: "fact_check",
    title: "Fact-check",
    description:
      "Extract verifiable claims and check each against live web search, returning per-claim evidence and verdicts. Slower and metered per claim.",
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
  },
  {
    name: "assess_neutrality",
    title: "Assess neutrality",
    description:
      "Assess framing, loaded language, one-sidedness, and omission without classifying political direction.",
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
  },
  {
    name: "detect_slop",
    title: "Detect AI slop",
    description:
      "Flag templated writing patterns and hollow phrasing with quoted evidence. Detects textual patterns, never authorship.",
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
  },
  {
    name: "explain",
    title: "Explain",
    description:
      "Explain dense academic or technical prose paragraph by paragraph for a selected audience level.",
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
  },
  {
    name: "start_adversarial_review",
    title: "Start adversarial paper review",
    description:
      "Start a persisted, venue-calibrated adversarial review of one complete PDF at a public URL and return a job id for polling.",
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
  },
  {
    name: "get_adversarial_review",
    title: "Get adversarial paper review",
    description:
      "Inspect a previously started adversarial-review job and return its progress or completed structured review.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
  },
] as const;

export type JidduMcpToolName = (typeof JIDDU_MCP_TOOLS)[number]["name"];

export function jidduMcpTool(name: JidduMcpToolName) {
  const tool = JIDDU_MCP_TOOLS.find((entry) => entry.name === name);
  if (!tool) throw new Error(`Unknown Jiddu MCP tool: ${name}`);
  return tool;
}

export const JIDDU_MCP_REGISTRY_MANIFEST = {
  $schema:
    "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
  name: JIDDU_MCP_NAME,
  title: JIDDU_MCP_TITLE,
  description: JIDDU_MCP_DESCRIPTION,
  version: JIDDU_MCP_VERSION,
  websiteUrl: "https://jiddu.app/developers",
  icons: JIDDU_MCP_ICONS,
  remotes: JIDDU_MCP_REMOTES,
} as const;

export const JIDDU_MCP_SERVER_CARD = {
  $schema:
    "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json",
  name: JIDDU_MCP_NAME,
  title: JIDDU_MCP_TITLE,
  description: JIDDU_MCP_DESCRIPTION,
  version: JIDDU_MCP_VERSION,
  websiteUrl: "https://jiddu.app/developers",
  icons: JIDDU_MCP_ICONS,
  remotes: JIDDU_MCP_REMOTES,
} as const;

export const JIDDU_AI_CATALOG = {
  specVersion: "1.0",
  entries: [
    {
      identifier: "urn:air:jiddu.app:mcp:jiddu",
      type: "application/mcp-server-card+json",
      url: JIDDU_MCP_SERVER_CARD_URL,
    },
  ],
} as const;

const MCP_SERVER_CARD_BODY = JSON.stringify(JIDDU_MCP_SERVER_CARD);
const AI_CATALOG_BODY = JSON.stringify(JIDDU_AI_CATALOG);

export function mcpServerCardResponse(request?: Request) {
  return publicDiscoveryResponse(
    MCP_SERVER_CARD_BODY,
    "application/mcp-server-card+json; charset=utf-8",
    request,
  );
}

export function aiCatalogResponse(request?: Request) {
  return publicDiscoveryResponse(
    AI_CATALOG_BODY,
    "application/ai-catalog+json; charset=utf-8",
    request,
  );
}

export function publicDiscoveryOptionsResponse() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export function legacyMcpServerCardRedirect(requestUrl: string) {
  const location = new URL(JIDDU_MCP_SERVER_CARD_PATH, requestUrl).toString();
  return new Response(null, {
    status: 308,
    headers: {
      ...corsHeaders(),
      "cache-control": "public, max-age=86400",
      location,
    },
  });
}

function publicDiscoveryResponse(
  body: string,
  contentType: string,
  request?: Request,
) {
  const etag = `"${createHash("sha256").update(body).digest("base64url")}"`;
  const headers = {
    ...corsHeaders(),
    "access-control-expose-headers": "ETag",
    "cache-control": "public, max-age=3600",
    "content-type": contentType,
    etag,
  };

  if (request && matchesEtag(request.headers.get("if-none-match"), etag)) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(body, { headers });
}

function corsHeaders() {
  return {
    "access-control-allow-headers": "Content-Type, If-None-Match",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-origin": "*",
  };
}

function matchesEtag(ifNoneMatch: string | null, etag: string) {
  if (!ifNoneMatch) return false;
  return ifNoneMatch
    .split(",")
    .map((value) => value.trim())
    .some((value) => value === "*" || value === etag || value === `W/${etag}`);
}
