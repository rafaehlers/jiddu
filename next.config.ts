import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "pdfjs-dist",
    "@mozilla/readability",
    "jsdom",
    // pdfjs-dist requires this at runtime to polyfill DOMMatrix / ImageData /
    // Path2D on Node versions without them natively (the Docker image runs
    // Node 22). Keep it external so its native binary isn't bundled.
    "@napi-rs/canvas",
  ],
  // Next.js's standalone tracer misses files reached via dynamic paths, so we
  // include them explicitly — otherwise they'd be absent from the Docker image.
  outputFileTracingIncludes: {
    // The /benchmark route reads docs/benchmark-politifact*.md (one per locale).
    "/benchmark": ["./docs/benchmark-politifact*.md"],
    // pdfjs-dist require()s @napi-rs/canvas dynamically (a bare string the
    // tracer can't follow), so force its package + platform binary into the
    // trace for every PDF-ingesting API route.
    "/api/**": [
      "./node_modules/@napi-rs/canvas/**/*",
      "./node_modules/@napi-rs/canvas-*/**/*",
    ],
  },
};

export default nextConfig;
