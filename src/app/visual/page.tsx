import type { Metadata } from "next";
import { ArchitectureMap } from "./architecture-map";

const title = "Jiddu System Atlas — Mapa interativo do codebase";
const description =
  "Explore as superfícies, pipelines, lentes, modelos, dados e infraestrutura que formam o Jiddu.";

export const metadata: Metadata = {
  title,
  description,
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function VisualPage() {
  return <ArchitectureMap />;
}
