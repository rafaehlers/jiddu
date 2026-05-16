import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pdfjs-dist", "@mozilla/readability", "jsdom"],
};

export default nextConfig;
