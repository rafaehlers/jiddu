"use client";

import { Download } from "lucide-react";

export function DownloadMarkdownButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border border-rule text-muted hover:text-foreground hover:border-foreground transition-colors"
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Markdown</span>
    </a>
  );
}
