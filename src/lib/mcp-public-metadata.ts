export const JIDDU_MCP_VERSION = "1.0.0";
export const JIDDU_MCP_URL = "https://jiddu.app/api/mcp";

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
  name: "app.jiddu/jiddu",
  title: "Jiddu Critical Reading",
  description:
    "Critical-reading tools for text analysis and adversarial PDF review.",
  version: JIDDU_MCP_VERSION,
  websiteUrl: "https://jiddu.app/developers",
  icons: [
    {
      src: "https://jiddu.app/icon.png",
      mimeType: "image/png",
      sizes: ["256x256"],
    },
  ],
  remotes: [
    {
      type: "streamable-http",
      url: JIDDU_MCP_URL,
    },
  ],
} as const;

export const JIDDU_MCP_SERVER_CARD = {
  name: "app.jiddu/jiddu",
  title: "Jiddu Critical Reading",
  description:
    "Use Jiddu when an agent needs to inspect the reasoning, factual claims, framing, clarity, or writing patterns in text, or run an adversarial review of a complete academic PDF.",
  version: JIDDU_MCP_VERSION,
  serverUrl: JIDDU_MCP_URL,
  transport: "streamable-http",
  authentication: {
    type: "oauth2",
    protectedResourceMetadata:
      "https://jiddu.app/.well-known/oauth-protected-resource",
  },
  documentationUrl: "https://jiddu.app/developers",
  privacyUrl: "https://jiddu.app/privacy",
  tools: JIDDU_MCP_TOOLS,
} as const;

export function mcpServerCardResponse() {
  return new Response(JSON.stringify(JIDDU_MCP_SERVER_CARD), {
    headers: {
      "cache-control": "public, max-age=300",
      "content-type": "application/mcp-server-card+json; charset=utf-8",
    },
  });
}
