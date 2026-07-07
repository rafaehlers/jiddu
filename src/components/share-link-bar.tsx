"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Check, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

export function ShareLinkBar({
  rightSlot,
}: {
  // Inline content rendered to the right of the share button — used by the
  // analysis viewers to place an "Export PDF" pill next to the share bar
  // instead of pushing both into the top header.
  rightSlot?: React.ReactNode;
} = {}) {
  const { t } = useI18n();
  // pathname changes whenever the route does; computing the URL from it (plus
  // origin) keeps the displayed value in sync after router.replace without an
  // effect-driven setState.
  const pathname = usePathname();
  const displayUrl =
    typeof window === "undefined" ? "" : window.location.origin + pathname;
  const [copied, setCopied] = useState(false);

  async function copy() {
    const fresh = typeof window === "undefined" ? displayUrl : window.location.href;
    if (!fresh) return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(fresh);
      ok = true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = fresh;
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
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    if (!ok) {
      setTimeout(() => window.prompt(t.share_link_label, fresh), 400);
    }
  }

  return (
    <div className="relative flex items-stretch gap-2">
      <button
        type="button"
        onClick={copy}
        title={t.share_link_hint}
        className={cn(
          "group flex-1 min-w-0 flex items-center gap-3 px-3 py-2.5 rounded-md border text-sm text-left",
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
        <span className="font-mono text-xs text-foreground/80 truncate flex-1 min-w-0">
          {displayUrl || "…"}
        </span>
      </button>

      {rightSlot && <div className="shrink-0 flex items-center">{rightSlot}</div>}

      <div
        aria-hidden={!copied}
        className={cn(
          "pointer-events-none absolute left-1/2 -translate-x-1/2 -top-3",
          "flex items-center gap-2 px-3 py-1.5 rounded-full",
          "bg-accent text-white text-xs font-medium shadow-lg",
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
