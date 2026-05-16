"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

export function ShareButton() {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this share link:", window.location.href);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={t.share}
      title={copied ? t.copied : t.share}
      className={cn(
        "inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border transition-colors",
        copied
          ? "border-foreground bg-foreground text-background"
          : "border-rule text-muted hover:text-foreground hover:border-foreground",
      )}
    >
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      <span className="hidden sm:inline">{copied ? t.copied : t.share}</span>
    </button>
  );
}
