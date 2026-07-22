import type { MetadataRoute } from "next";

// Static — no per-request logic needed, so Next prerenders this once at
// build time (same as sitemap.ts).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin", // password-gated operator console
        "/api/", // JSON endpoints, not pages — the public v1 API is documented at /api-access, not meant to be crawled
        "/live", // intentionally unlinked while in beta (see how-it-works §12)
        "/a/*/print", // print view of an analysis — duplicate content of the main page
        "/f/*/print",
        "/n/*/print",
        "/e/*/print",
      ],
    },
    sitemap: "https://jiddu.app/sitemap.xml",
  };
}
