export type AgentMarkdownDocument = {
  title: string;
  body: string;
};

const HOME = `# Jiddu — Read anything with a critical mind

Jiddu helps people and agents inspect text before trusting, quoting, citing, publishing, or repeating it. Its analyses are automated and can be wrong; always read the explanation, the quoted passage, and any cited evidence.

## When to use Jiddu

- Detect logical fallacies in an argument.
- Extract factual claims and verify them against current web sources.
- Assess loaded framing, one-sidedness, omission, and false equivalence without assigning a left/right label.
- Explain dense academic or technical prose for a selected audience.
- Flag templated writing patterns without guessing whether a human or AI wrote the text.
- Run a venue-calibrated adversarial review of one complete academic PDF.

## Product surfaces

- [Web app](https://jiddu.app/)
- [How Jiddu works](https://jiddu.app/how-it-works)
- [Developer documentation](https://jiddu.app/developers)
- [OpenAPI description](https://jiddu.app/openapi.json)
- [Hosted MCP server](https://jiddu.app/api/mcp)
- [MCP Registry manifest](https://jiddu.app/server.json)
- [Agent instructions](https://jiddu.app/llms.txt)

## Trust and support

- [About Jiddu](https://jiddu.app/about)
- [Privacy policy](https://jiddu.app/privacy)
- [Terms of service](https://jiddu.app/terms)
- [Contact](https://jiddu.app/contact)
`;

const DEVELOPERS = `# Jiddu Developer Docs — REST API, OpenAPI & MCP

Jiddu exposes five synchronous text-analysis operations and one asynchronous adversarial-review workflow. Requests and results belong to a verified Jiddu account and use that account's included access or Jiddu Credits.

## Machine-readable discovery

- [OpenAPI description](https://jiddu.app/openapi.json)
- [MCP Registry manifest](https://jiddu.app/server.json)
- [AI catalog](https://jiddu.app/.well-known/ai-catalog.json)
- [MCP server card](https://jiddu.app/api/mcp/server-card)
- [OAuth protected-resource metadata](https://jiddu.app/.well-known/oauth-protected-resource)
- [Agent instructions](https://jiddu.app/llms.txt)

## REST API

Base URL: \`https://jiddu.app/api/v1\`

- \`POST /detect-fallacies\`
- \`POST /fact-check\`
- \`POST /assess-neutrality\`
- \`POST /explain\`
- \`POST /detect-slop\`
- \`POST /adversarial-reviews\`
- \`GET /adversarial-reviews/{id}\`

Authenticate REST requests with \`X-Jiddu-Key\`. Verified users create and revoke keys at [API keys in their account](https://jiddu.app/account?tab=api). Text operations accept \`text\` plus optional \`lang\` (\`en\`, \`pt\`, or \`es\`); see OpenAPI for exact limits and response schemas.

## Hosted MCP

Connect a Streamable HTTP MCP client to \`https://jiddu.app/api/mcp\`. Compatible clients discover WorkOS OAuth automatically. The server exposes \`detect_fallacies\`, \`fact_check\`, \`assess_neutrality\`, \`explain\`, \`detect_slop\`, \`start_adversarial_review\`, and \`get_adversarial_review\`.

## Reliability

Honor HTTP 429 and \`retry_after_seconds\`. Fact-checking performs live search per claim and is slower. Adversarial review is asynchronous: start the job, wait the returned interval, and poll until \`complete\` or \`failed\`. Outputs are automated and must not be treated as final authority.
`;

const ABOUT = `# About Jiddu

Jiddu is an independent critical-reading product built and operated by Rafael de Menezes Ehlers in Brazil. It helps readers slow down before trusting, quoting, citing, or publishing a text.

## What it does

Jiddu detects logical fallacies, verifies factual claims with current web sources, assesses framing without assigning a left/right label, explains dense papers, identifies templated prose, and runs venue-calibrated adversarial reviews of complete academic PDFs. People use these workflows on the web; developers and agents can call the same capabilities through REST or Streamable HTTP MCP.

## Method and limits

The product uses structured prompts, typed schemas, document segmentation, source validation, model fallback, deterministic checks, and persisted reports. Every analysis is automated and can be incomplete or wrong. Jiddu has no human editorial desk and does not replace professional, academic, medical, legal, or financial judgment.

- [How it works](https://jiddu.app/how-it-works)
- [Developer docs](https://jiddu.app/developers)
- [Privacy policy](https://jiddu.app/privacy)
- [Contact](https://jiddu.app/contact)
`;

const CONTACT = `# Contact Jiddu

Use the public contact channel for corrections to an analysis, privacy or deletion requests, account and billing questions, partnership ideas, and integration problems involving REST, OpenAPI, the Chrome extension, or the hosted MCP server.

Include the relevant public report URL, endpoint, approximate time, and a concise description. Never send an API key, OAuth token, payment credential, confidential manuscript, or another secret. Jiddu Support may request additional non-secret diagnostic information by email.

Jiddu is operated by Rafael de Menezes Ehlers in Brazil. Submit the [contact form](https://jiddu.app/contact) or email support@emails.jiddu.app. A correction request triggers review but does not guarantee that an automated finding, verdict, or source will change.
`;

const DOCUMENTS: Record<string, AgentMarkdownDocument> = {
  "/": { title: "Jiddu", body: HOME },
  "/developers": { title: "Jiddu Developer Docs", body: DEVELOPERS },
  "/api-access": { title: "Jiddu Developer Docs", body: DEVELOPERS },
  "/about": { title: "About Jiddu", body: ABOUT },
  "/contact": { title: "Contact Jiddu", body: CONTACT },
};

const KNOWN_ROOT_SEGMENTS = new Set([
  "a",
  "about",
  "account",
  "admin",
  "api",
  "api-access",
  "benchmark",
  "blog",
  "callback",
  "contact",
  "context",
  "developers",
  "e",
  "explain",
  "extension",
  "f",
  "factcheck",
  "fallacies",
  "how-it-works",
  "invite",
  "legal",
  "live",
  "login",
  "mcp",
  "n",
  "neutrality",
  "openapi.json",
  "pricing",
  "privacy",
  "r",
  "review",
  "s",
  "server.json",
  "signup",
  "slop",
  "slop-patterns",
  "terms",
  "visual",
]);

export function agentMarkdownForPath(
  pathname: string,
): AgentMarkdownDocument | null {
  return DOCUMENTS[pathname.replace(/\/$/, "") || "/"] ?? null;
}

export function isDefinitelyUnknownRootPath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 1) return false;
  const root = segments[0];
  if (!root || root.startsWith(".") || root.includes("_next")) return false;
  return !KNOWN_ROOT_SEGMENTS.has(root);
}

export function agentNotFoundMarkdown(pathname: string): string {
  return `# 404 — Jiddu page not found

The requested path \`${pathname}\` does not exist.

Try one of these machine-readable recovery points:

- [Jiddu sitemap](https://jiddu.app/sitemap.xml)
- [Agent instructions](https://jiddu.app/llms.txt)
- [Developer documentation](https://jiddu.app/developers)
- [OpenAPI description](https://jiddu.app/openapi.json)
- [Homepage](https://jiddu.app/)
`;
}
