import type { Metadata } from "next";
import fs from "node:fs/promises";
import path from "node:path";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BenchmarkBody } from "@/components/benchmark-body";

// The benchmark report is the single source-of-truth artifact: a human
// readable summary of the PolitiFact run that lives at the project root
// (also reachable on GitHub for devs). Rendering it as an in-site page
// avoids sending visitors offsite when they click "Full methodology" on
// the homepage card.
//
// i18n strategy: each language has its own sibling markdown file in
// docs/ (benchmark-politifact.md = English default, .pt.md, .es.md).
// We load all three server-side and pass them to the client; the client
// component picks which to render based on the user's current i18n
// language. This is wasteful on initial payload (~36KB total instead of
// ~12KB) but lets us keep the markdown source as plain files that any
// editor can update without touching i18n machinery, and avoids needing
// a cookie or header to communicate the language to the server.
export const metadata: Metadata = {
  title: "Jiddu — PolitiFact benchmark",
  description:
    "Quality measurement of the Jiddu fact-check pipeline against the PolitiFact human-labeled corpus. Full methodology, confusion matrix, and disagreement analysis.",
};

async function loadMarkdown(slug: "en" | "pt" | "es"): Promise<string> {
  const suffix = slug === "en" ? "" : `.${slug}`;
  const file = path.join(
    process.cwd(),
    "docs",
    `benchmark-politifact${suffix}.md`,
  );
  return fs.readFile(file, "utf8");
}

export default async function BenchmarkPage() {
  const [en, pt, es] = await Promise.all([
    loadMarkdown("en"),
    loadMarkdown("pt"),
    loadMarkdown("es"),
  ]);
  return (
    <>
      <SiteHeader variant="guide" />
      <main className="flex-1">
        <BenchmarkBody en={en} pt={pt} es={es} />
      </main>
      <SiteFooter />
    </>
  );
}
