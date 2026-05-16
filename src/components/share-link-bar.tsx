"use client";

import { useState } from "react";
import { Check, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

export function ShareLinkBar() {
  const { t } = useI18n();
  const [url] = useState<string>(() =>
    typeof window === "undefined" ? "" : window.location.href,
  );
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!url) return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch {
      // Fallback for non-secure contexts: use a transient textarea + execCommand.
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    // Show the visual feedback either way — the user clicked the button and the
    // intent is clear, even if the browser blocked the clipboard write.
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    if (!ok) {
      // Last-resort prompt so the user can still grab the URL.
      setTimeout(() => window.prompt(t.share_link_label, url), 400);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={copy}
        title={t.share_link_hint}
        className={cn(
          "group w-full flex items-center gap-3 px-3 py-2.5 rounded-md border text-sm text-left",
          "transition-all duration-200",
          copied
            ? "border-[var(--severity-low)] bg-[color-mix(in_oklab,var(--severity-low)_18%,transparent)]"
            : "border-rule bg-paper hover:border-foreground",
        )}
      >
        {copied ? (
          <Check className="h-4 w-4 shrink-0 text-[var(--severity-low)]" />
        ) : (
          <LinkIcon className="h-4 w-4 shrink-0 text-muted group-hover:text-foreground transition-colors" />
        )}
        <span
          className={cn(
            "text-xs uppercase tracking-wide shrink-0 transition-colors",
            copied ? "text-[var(--severity-low)] font-medium" : "text-muted",
          )}
        >
          {copied ? t.link_copied : t.share_link_label}
        </span>
        <span className="font-mono text-xs text-foreground/80 truncate flex-1 min-w-0">{url}</span>
      </button>

      {/* Floating confirmation toast */}
      <div
        aria-hidden={!copied}
        className={cn(
          "pointer-events-none absolute left-1/2 -translate-x-1/2 -top-3",
          "flex items-center gap-2 px-3 py-1.5 rounded-full",
          "bg-foreground text-background text-xs font-medium shadow-lg",
          "transition-all duration-300",
          copied
            ? "opacity-100 -translate-y-full"
            : "opacity-0 -translate-y-[calc(100%-8px)]",
        )}
      >
        <Check className="h-3.5 w-3.5" />
        <span>{t.link_copied}</span>
      </div>
    </div>
  );
}
