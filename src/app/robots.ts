import type { MetadataRoute } from "next";

// Static — no per-request logic needed, so Next prerenders this once at
// build time (same as sitemap.ts).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/mcp"],
      disallow: [
        "/admin", // WorkOS-authenticated operator console
        "/visual", // owner-only internal codebase atlas
        "/invite", // private invitation claim and acceptance flow
        "/api/", // JSON endpoints are described by /openapi.json; /api/mcp is explicitly allowed for agent discovery
        "/context/*", // private saved Context workspaces
        "/a/*/print", // print view of an analysis — duplicate content of the main page
        "/f/*/print",
        "/n/*/print",
        "/e/*/print",
        "/s/*/print",
      ],
    },
    sitemap: "https://jiddu.app/sitemap.xml",
  };
}
