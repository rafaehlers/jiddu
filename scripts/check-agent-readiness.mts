import assert from "node:assert/strict";

const baseUrl = (process.env.JIDDU_SMOKE_BASE_URL ?? "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);

async function get(
  path: string,
  init?: RequestInit,
): Promise<{ response: Response; body: string }> {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    ...init,
  });
  return { response, body: await response.text() };
}

const openapi = await get("/openapi.json");
assert.equal(openapi.response.status, 200);
assert.match(openapi.response.headers.get("content-type") ?? "", /application\/json/);
assert.equal(JSON.parse(openapi.body).openapi, "3.1.0");

const registryManifest = await get("/server.json");
assert.equal(registryManifest.response.status, 200);
assert.equal(JSON.parse(registryManifest.body).name, "app.jiddu/jiddu");

const serverCard = await get("/.well-known/mcp/server-card.json");
assert.equal(serverCard.response.status, 200);
assert.match(
  serverCard.response.headers.get("content-type") ?? "",
  /application\/mcp-server-card\+json/,
);
assert.equal(JSON.parse(serverCard.body).tools.length, 7);

const serverCardAlias = await get("/mcp/server-card");
assert.equal(serverCardAlias.response.status, 200);
assert.deepEqual(JSON.parse(serverCardAlias.body), JSON.parse(serverCard.body));

const protectedResource = await get("/.well-known/oauth-protected-resource");
assert.equal(protectedResource.response.status, 200);
assert.deepEqual(JSON.parse(protectedResource.body).scopes_supported, [
  "openid",
  "profile",
  "email",
  "offline_access",
]);

const llms = await get("/llms.txt");
assert.equal(llms.response.status, 200);
assert.match(llms.body, /## When to use Jiddu/);
assert.match(llms.body, /https:\/\/jiddu\.app\/openapi\.json/);

const sitemap = await get("/sitemap.xml");
assert.equal(sitemap.response.status, 200);
assert.match(sitemap.body, /https:\/\/jiddu\.app\/developers/);
assert.match(sitemap.body, /https:\/\/jiddu\.app\/about/);

const robots = await get("/robots.txt");
assert.equal(robots.response.status, 200);
assert.match(robots.body, /Allow: \/api\/mcp/);

for (const path of ["/developers", "/api-access", "/about", "/contact"]) {
  const page = await get(path, { headers: { Accept: "text/html" } });
  assert.equal(page.response.status, 200, `${path} did not render`);
  assert.match(page.response.headers.get("content-type") ?? "", /text\/html/);
}

const homepage = await get("/", { headers: { Accept: "text/html" } });
assert.equal(homepage.response.status, 200);
assert.match(homepage.body, /application\/ld\+json/);
assert.match(homepage.body, /SoftwareApplication/);

for (const path of ["/", "/developers", "/api-access", "/about", "/contact"]) {
  const markdown = await get(path, { headers: { Accept: "text/markdown" } });
  assert.equal(markdown.response.status, 200, `${path} has no Markdown variant`);
  assert.match(markdown.response.headers.get("content-type") ?? "", /text\/markdown/);
  assert.match(markdown.response.headers.get("vary") ?? "", /Accept/i);
  assert.match(markdown.body, /^# /);
}

const unsupported = await get("/developers", {
  headers: { Accept: "application/json" },
});
assert.equal(unsupported.response.status, 406);
assert.match(unsupported.response.headers.get("vary") ?? "", /Accept/i);

const markdown404 = await get("/definitely-not-a-jiddu-page", {
  headers: { Accept: "text/markdown" },
});
assert.equal(markdown404.response.status, 404);
assert.match(markdown404.response.headers.get("content-type") ?? "", /text\/markdown/);
assert.match(markdown404.body, /sitemap\.xml/);
assert.match(markdown404.body, /llms\.txt/);

const html404 = await get("/definitely-not-a-jiddu-page", {
  headers: { Accept: "text/html" },
});
assert.equal(html404.response.status, 404);
assert.match(html404.response.headers.get("content-type") ?? "", /text\/html/);
assert.match(html404.body, /sitemap\.xml/);

process.stdout.write(`Agent-readiness smoke checks passed for ${baseUrl}\n`);
