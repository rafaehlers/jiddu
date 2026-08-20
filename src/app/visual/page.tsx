import type { Metadata } from "next";
import { ArchitectureMap } from "./architecture-map";
import { publicPageMetadata } from "@/lib/social-metadata";

const title = "Jiddu System Atlas — Mapa interativo do codebase";
const description =
  "Explore as superfícies, pipelines, lentes, modelos, dados e infraestrutura que formam o Jiddu.";

export const metadata: Metadata = publicPageMetadata({
  title,
  description,
  path: "/visual",
});

export default function VisualPage() {
  return <ArchitectureMap />;
}
