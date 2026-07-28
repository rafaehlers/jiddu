"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyCode({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  async function copy() {
    let successful = false;
    try {
      await navigator.clipboard.writeText(value);
      successful = true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      successful = document.execCommand("copy");
      textarea.remove();
    }

    if (!successful) {
      window.prompt("Copy this value:", value);
      return;
    }

    setCopied(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded border border-rule bg-paper px-3 py-2 text-sm transition-colors hover:border-foreground/50"
    >
      {copied ? (
        <Check className="size-4 text-[var(--severity-low)]" aria-hidden="true" />
      ) : (
        <Copy className="size-4" aria-hidden="true" />
      )}
      <span className="hidden sm:inline" aria-live="polite">
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}
