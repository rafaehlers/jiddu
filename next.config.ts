import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist", "@mozilla/readability", "jsdom"],
};

export default nextConfig;
