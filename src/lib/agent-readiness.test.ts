import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  agentMarkdownForPath,
  agentNotFoundMarkdown,
  isDefinitelyUnknownRootPath,
} from "./agent-markdown";
import {
  mergeVaryHeader,
  negotiateAgentRepresentation,
} from "./markdown-negotiation";
import {
  JIDDU_AI_CATALOG,
  JIDDU_AI_CATALOG_URL,
  JIDDU_MCP_REGISTRY_MANIFEST,
  JIDDU_MCP_SERVER_CARD,
  JIDDU_MCP_SERVER_CARD_URL,
  JIDDU_MCP_TOOLS,
  aiCatalogResponse,
  legacyMcpServerCardRedirect,
  mcpServerCardResponse,
} from "./mcp-public-metadata";
import { HOME_JSON_LD } from "./site-json-ld";

test("negotiates Markdown without changing ordinary browser requests", () => {
  assert.equal(negotiateAgentRepresentation(null), "html");
  assert.equal(negotiateAgentRepresentation("text/markdown"), "markdown");
  assert.equal(
    negotiateAgentRepresentation("text/markdown, text/html;q=0.8"),
    "markdown",
  );
  assert.equal(
    negotiateAgentRepresentation(
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    ),
    "html",
  );
  assert.equal(
    negotiateAgentRepresentation("text/markdown;q=0, text/html"),
    "html",
  );
  assert.equal(negotiateAgentRepresentation("text/plain"), "html");
  assert.equal(negotiateAgentRepresentation("application/json"), null);
});

test("merges Vary headers case-insensitively", () => {
  assert.deepEqual(
    mergeVaryHeader("RSC, Accept-Encoding", "Accept", "accept-encoding")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .sort(),
    ["accept", "accept-encoding", "rsc"],
  );
});

test("serves useful Markdown documents and recovery links", () => {
  const homepage = agentMarkdownForPath("/");
  assert.ok(homepage);
  assert.match(homepage.body, /## When to use Jiddu/);
  assert.match(homepage.body, /https:\/\/jiddu\.app\/developers/);
  assert.equal(agentMarkdownForPath("/developers/")?.title, "Jiddu Developer Docs");

  assert.equal(isDefinitelyUnknownRootPath("/not-a-jiddu-page"), true);
  assert.equal(isDefinitelyUnknownRootPath("/developers"), false);
  assert.equal(isDefinitelyUnknownRootPath("/blog/a-post"), false);

  const notFound = agentNotFoundMarkdown("/not-a-jiddu-page");
  assert.match(notFound, /404/);
  assert.match(notFound, /sitemap\.xml/);
  assert.match(notFound, /llms\.txt/);
  assert.match(notFound, /openapi\.json/);
});

test("publishes consistent MCP discovery metadata", () => {
  assert.equal(JIDDU_MCP_REGISTRY_MANIFEST.name, "app.jiddu/jiddu");
  assert.equal(
    JIDDU_MCP_REGISTRY_MANIFEST.remotes[0].url,
    "https://jiddu.app/api/mcp",
  );
  assert.match(JIDDU_MCP_REGISTRY_MANIFEST.$schema, /server\.schema\.json$/);
  assert.equal(
    JIDDU_MCP_SERVER_CARD.$schema,
    "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json",
  );
  assert.equal(JIDDU_MCP_SERVER_CARD.name, JIDDU_MCP_REGISTRY_MANIFEST.name);
  assert.equal(JIDDU_MCP_SERVER_CARD.title, JIDDU_MCP_REGISTRY_MANIFEST.title);
  assert.equal(
    JIDDU_MCP_SERVER_CARD.description,
    JIDDU_MCP_REGISTRY_MANIFEST.description,
  );
  assert.equal(JIDDU_MCP_SERVER_CARD.version, JIDDU_MCP_REGISTRY_MANIFEST.version);
  assert.deepEqual(JIDDU_MCP_SERVER_CARD.icons, JIDDU_MCP_REGISTRY_MANIFEST.icons);
  assert.deepEqual(JIDDU_MCP_SERVER_CARD.remotes, JIDDU_MCP_REGISTRY_MANIFEST.remotes);
  assert.ok(JIDDU_MCP_SERVER_CARD.description.length <= 100);
  assert.equal("tools" in JIDDU_MCP_SERVER_CARD, false);
  assert.equal("authentication" in JIDDU_MCP_SERVER_CARD, false);

  assert.equal(JIDDU_AI_CATALOG.specVersion, "1.0");
  assert.equal(JIDDU_AI_CATALOG.entries.length, 1);
  assert.equal(
    JIDDU_AI_CATALOG.entries[0].type,
    "application/mcp-server-card+json",
  );
  assert.equal(JIDDU_AI_CATALOG.entries[0].url, JIDDU_MCP_SERVER_CARD_URL);

  assert.equal(JIDDU_MCP_TOOLS.length, 7);
  assert.equal(
    new Set(JIDDU_MCP_TOOLS.map((tool) => tool.name)).size,
    JIDDU_MCP_TOOLS.length,
  );
  for (const tool of JIDDU_MCP_TOOLS) {
    assert.ok(tool.description.length >= 70);
    assert.equal(typeof tool.annotations.readOnlyHint, "boolean");
  }
});

test("serves cacheable MCP discovery documents with browser-safe CORS", async () => {
  const request = new Request(JIDDU_MCP_SERVER_CARD_URL);
  const card = mcpServerCardResponse(request);
  assert.equal(card.status, 200);
  assert.match(
    card.headers.get("content-type") ?? "",
    /application\/mcp-server-card\+json/,
  );
  assert.equal(card.headers.get("access-control-allow-origin"), "*");
  assert.match(card.headers.get("cache-control") ?? "", /max-age=3600/);
  const etag = card.headers.get("etag");
  assert.ok(etag);
  assert.deepEqual(await card.json(), JIDDU_MCP_SERVER_CARD);

  const notModified = mcpServerCardResponse(
    new Request(JIDDU_MCP_SERVER_CARD_URL, {
      headers: { "if-none-match": etag },
    }),
  );
  assert.equal(notModified.status, 304);

  const catalog = aiCatalogResponse(new Request(JIDDU_AI_CATALOG_URL));
  assert.match(
    catalog.headers.get("content-type") ?? "",
    /application\/ai-catalog\+json/,
  );
  assert.deepEqual(await catalog.json(), JIDDU_AI_CATALOG);
});

test("redirects legacy MCP server-card routes to the public canonical URL", () => {
  const response = legacyMcpServerCardRedirect();
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), JIDDU_MCP_SERVER_CARD_URL);
});

test("homepage JSON-LD identifies the operator, product, and contact route", () => {
  const graph = HOME_JSON_LD["@graph"];
  assert.deepEqual(
    graph.map((entity) => entity["@type"]),
    ["Organization", "SoftwareApplication", "WebSite"],
  );
  const organization = graph[0];
  assert.equal(organization.email, "support@emails.jiddu.app");
  assert.equal(organization.address.addressCountry, "BR");
  assert.equal(organization.contactPoint[0].url, "https://jiddu.app/contact");
  assert.equal(graph[1].publisher["@id"], organization["@id"]);
});

test("llms.txt gives agents task and discovery guidance", async () => {
  const contents = await readFile(
    new URL("../../public/llms.txt", import.meta.url),
    "utf8",
  );
  assert.match(contents, /## When to use Jiddu/);
  assert.match(contents, /https:\/\/jiddu\.app\/openapi\.json/);
  assert.match(contents, /https:\/\/jiddu\.app\/server\.json/);
  assert.match(contents, /https:\/\/jiddu\.app\/\.well-known\/ai-catalog\.json/);
  assert.match(contents, /https:\/\/jiddu\.app\/api\/mcp\/server-card/);
  assert.doesNotMatch(contents, /\.well-known\/mcp\/server-card\.json/);
});
