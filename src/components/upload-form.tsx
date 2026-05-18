"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import type { Messages } from "@/lib/i18n/messages";

type Tab = "url" | "text" | "file";

type ErrorState = {
  message: string;
  code?: string;
};

type Mode = "detector" | "factcheck";

type Props = {
  onSubmit: (
    sourceType: Tab,
    body: BodyInit,
    contentType: string | null,
  ) => Promise<void>;
  error?: ErrorState | null;
  onClearError?: () => void;
  /**
   * Custom label for the submit button. Defaults to the localized
   * "Analyze" string. Used by the fact-check composer to switch the CTA
   * to "Extract claims" while reusing the same form scaffold.
   */
  submitLabel?: string;
  /**
   * Which mode this form is being rendered in. Drives the active state of
   * the top-row mode toggle and gates the Live tab (only available in the
   * fallacy detector mode).
   */
  mode?: Mode;
};

export function UploadForm({
  onSubmit,
  error,
  onClearError,
  submitLabel,
  mode = "detector",
}: Props) {
  const { t, lang } = useI18n();
  const [tab, setTab] = useState<Tab>("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<ErrorState | null>(null);

  const visibleError = error ?? localError;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    onClearError?.();
    try {
      if (tab === "file") {
        if (!file) throw new Error("Choose a PDF or TXT file");
        const fd = new FormData();
        fd.set("file", file);
        fd.set("lang", lang);
        await onSubmit("file", fd, null);
      } else {
        const body = JSON.stringify(
          tab === "url"
            ? { type: "url", url, lang }
            : { type: "text", text, lang },
        );
        await onSubmit(tab, body, "application/json");
      }
    } catch (err) {
      setLocalError({
        message: err instanceof Error ? err.message : "Something went wrong",
      });
    }
  }

  function switchToPaste() {
    setTab("text");
    setLocalError(null);
    onClearError?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 bg-paper border border-rule rounded-lg p-5 shadow-sm"
    >
      {/* Top row: mode toggle (Detector / Fact-check) sits before the
          input-type tabs. Each pill is a Link, so the active state survives
          page navigation. */}
      <div className="flex items-center gap-1 bg-background border border-rule rounded-md p-1 self-start">
        <ModeButton href="/" active={mode === "detector"}>
          {t.mode_detector}
        </ModeButton>
        <ModeButton href="/factcheck" active={mode === "factcheck"}>
          {t.mode_factcheck}
        </ModeButton>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <TabButton active={tab === "url"} onClick={() => setTab("url")}>{t.tab_url}</TabButton>
        <TabButton active={tab === "text"} onClick={() => setTab("text")}>{t.tab_paste}</TabButton>
        <TabButton active={tab === "file"} onClick={() => setTab("file")}>{t.tab_file}</TabButton>
        {mode === "detector" && (
          <Link
            href="/live"
            className="px-3 py-1.5 rounded-md text-sm border border-rule text-muted hover:text-foreground transition-colors inline-flex items-center gap-1.5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--severity-high)] animate-pulse" aria-hidden />
            {t.tab_live}
          </Link>
        )}
      </div>

      {tab === "url" && (
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t.url_placeholder}
          className="w-full bg-background border border-rule rounded-md px-3 py-2 outline-none focus:border-accent"
        />
      )}

      {tab === "text" && (
        <textarea
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder={t.paste_placeholder}
          className="w-full bg-background border border-rule rounded-md px-3 py-2 outline-none focus:border-accent font-serif text-base leading-relaxed"
        />
      )}

      {tab === "file" && (
        <label className="flex flex-col items-center justify-center border border-dashed border-rule rounded-md py-10 cursor-pointer hover:bg-background/40 transition-colors">
          <input
            type="file"
            accept=".pdf,application/pdf,.txt,text/plain"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <span className="font-serif text-lg">
            {file ? file.name : t.file_drop_hint}
          </span>
          {!file && <span className="text-sm text-muted mt-1">{t.file_size_hint}</span>}
        </label>
      )}

      {visibleError && (
        <ErrorBox error={visibleError} t={t} onSwitchToPaste={switchToPaste} fromTab={tab} />
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">{t.form_hint}</span>
        <button
          type="submit"
          className={cn(
            "px-5 py-2 rounded-md bg-foreground text-background font-medium",
            "hover:opacity-90 transition-opacity",
          )}
        >
          {submitLabel ?? t.analyze}
        </button>
      </div>
    </form>
  );
}

function ErrorBox({
  error,
  t,
  onSwitchToPaste,
  fromTab,
}: {
  error: ErrorState;
  t: Messages;
  onSwitchToPaste: () => void;
  fromTab: Tab;
}) {
  const friendly = friendlyError(error.code, t);
  const isUrlError =
    fromTab === "url" &&
    !!error.code &&
    ["blocked", "not_found", "rate_limited", "timeout", "unreachable", "extraction_failed"].includes(
      error.code,
    );

  return (
    <div className="rounded-md border border-[var(--severity-high)]/40 bg-[color-mix(in_oklab,var(--severity-high)_8%,transparent)] p-4 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-[var(--severity-high)]">
          {friendly.title}
        </p>
        {friendly.hint && (
          <p className="text-sm text-foreground/85 leading-snug">{friendly.hint}</p>
        )}
        <p className="text-xs text-muted mt-1 font-mono">{error.message}</p>
      </div>
      {isUrlError && (
        <div>
          <button
            type="button"
            onClick={onSwitchToPaste}
            className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-foreground text-background hover:opacity-90 transition-opacity"
          >
            {t.switch_to_paste}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function friendlyError(
  code: string | undefined,
  t: Messages,
): { title: string; hint?: string } {
  switch (code) {
    case "blocked":
      return { title: t.ingest_blocked_title, hint: t.ingest_blocked_hint };
    case "not_found":
      return { title: t.ingest_not_found_title, hint: t.ingest_not_found_hint };
    case "rate_limited":
      return { title: t.ingest_rate_limited_title, hint: t.ingest_rate_limited_hint };
    case "timeout":
      return { title: t.ingest_timeout_title, hint: t.ingest_timeout_hint };
    case "unreachable":
      return { title: t.ingest_unreachable_title, hint: t.ingest_unreachable_hint };
    case "extraction_failed":
      return {
        title: t.ingest_extraction_failed_title,
        hint: t.ingest_extraction_failed_hint,
      };
    case "invalid_url":
      return { title: t.ingest_invalid_url_title };
    case "too_short":
      return { title: t.ingest_too_short_title };
    default:
      return { title: t.analysis_failed };
  }
}

function ModeButton({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "px-3 py-1.5 rounded text-sm font-medium transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-muted hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-md text-sm border transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-rule text-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
