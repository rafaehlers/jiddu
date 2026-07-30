import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.jiddu.app",
          },
        ],
        destination: "https://jiddu.app/:path*",
        permanent: true,
      },
    ];
  },
  serverExternalPackages: [
    "pdfjs-dist",
    "@mozilla/readability",
    "jsdom",
    // Native Rust/PDFium binding used by the layout-aware academic PDF path.
    "@llamaindex/liteparse",
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
    // pdfjs-dist loads two things via paths the tracer can't follow: a
    // dynamic require of @napi-rs/canvas (a bare string), and its worker
    // (pdf.worker.mjs) as a fake worker in Node. Force both — the canvas
    // package + platform binary and the whole legacy build dir — into the
    // trace for every PDF-ingesting API route.
    "/api/**": [
      "./node_modules/@napi-rs/canvas/**/*",
      "./node_modules/@napi-rs/canvas-*/**/*",
      "./node_modules/pdfjs-dist/legacy/build/**/*",
      "./node_modules/@llamaindex/liteparse/**/*",
      "./node_modules/@llamaindex/liteparse-*/**/*",
    ],
  },
};

export default nextConfig;
