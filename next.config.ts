import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pdfjs-dist", "@mozilla/readability", "jsdom"],
  // The /benchmark route reads docs/benchmark-politifact*.md (one file
  // per locale) at request time. Next.js's standalone tracer doesn't see
  // the dynamic fs.readFile paths, so we explicitly include them in the
  // trace output. Without this the files would be missing from the
  // Docker image.
  outputFileTracingIncludes: {
    "/benchmark": ["./docs/benchmark-politifact*.md"],
  },
};

export default nextConfig;
