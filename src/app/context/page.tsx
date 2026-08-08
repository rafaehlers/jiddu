import type { Metadata } from "next";
import { ContextWorkspace } from "@/components/context/context-workspace";
import { publicPageMetadata } from "@/lib/social-metadata";
import { loadStringSettings } from "@/lib/settings";

export const metadata: Metadata = publicPageMetadata({
  title: "Jiddu Context — live conversation intelligence",
  description:
    "Map people, organizations, events and their connections while a conversation unfolds.",
  path: "/context",
});

export default async function ContextPage() {
  const settings = await loadStringSettings();
  return (
    <ContextWorkspace
      searchModels={{
        news: settings["context.newsModel"],
        factCheck: settings["factcheck.fastModel"],
      }}
    />
  );
}
