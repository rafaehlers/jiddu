"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import type { Messages } from "@/lib/i18n/messages";
import { MODEL_CATALOG } from "@/lib/llm";
import { EXPLAIN_LEVELS, type ExplainLevel } from "@/lib/explain-schema";

type Tab = "url" | "text" | "file";

type ErrorState = {
  message: string;
  code?: string;
};

type Mode = "detector" | "factcheck" | "neutrality" | "explain";

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
  const [model, setModel] = useState<string>(MODEL_CATALOG[0].id);
  // Explanation audience level. Only sent (and only shown) in explain mode;
  // "undergrad" is the sensible default for an academic paper.
  const [level, setLevel] = useState<ExplainLevel>("undergrad");
  // True while a file is being dragged over the form, for the drop highlight.
  const [dragging, setDragging] = useState(false);

  const visibleError = error ?? localError;

  // Stop the browser from navigating to (opening) a file dropped anywhere on
  // the page. Without this, dragging a PDF onto the window replaces the tab
  // with the raw PDF instead of doing nothing. The form's own onDrop still
  // runs for drops that land on it.
  useEffect(() => {
    const prevent = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) e.preventDefault();
    };
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

  function acceptFile(f: File | undefined) {
    if (!f) return;
    const lower = f.name.toLowerCase();
    const ok =
      lower.endsWith(".pdf") ||
      lower.endsWith(".txt") ||
      f.type === "application/pdf" ||
      f.type.startsWith("text/");
    if (!ok) {
      setLocalError({ message: "Unsupported file type. Use PDF or TXT." });
      return;
    }
    setFile(f);
    setTab("file");
    setLocalError(null);
    onClearError?.();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    acceptFile(e.dataTransfer.files?.[0]);
  }

  function handleDragOver(e: React.DragEvent) {
    if (e.dataTransfer?.types?.includes("Files")) {
      e.preventDefault();
      if (!dragging) setDragging(true);
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear when the cursor leaves the form itself, not when it moves
    // between the form's children (which also bubble a dragleave).
    if (e.currentTarget === e.target) setDragging(false);
  }

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
        fd.set("model", model);
        if (mode === "explain") fd.set("level", level);
        await onSubmit("file", fd, null);
      } else {
        const base =
          tab === "url"
            ? { type: "url", url, lang, model }
            : { type: "text", text, lang, model };
        const body = JSON.stringify(
          mode === "explain" ? { ...base, level } : base,
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
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col gap-4 sm:gap-5 bg-paper border border-rule rounded-lg p-4 sm:p-5 shadow-sm transition-shadow",
        dragging && "ring-2 ring-accent",
      )}
    >
      {/* Top row: mode toggle (Detector / Fact-check) sits before the
          input-type tabs. Each pill is a Link, so the active state survives
          page navigation. */}
      <div className="flex items-center gap-1 bg-background border border-rule rounded-md p-1 self-start flex-wrap">
        <ModeButton href="/" active={mode === "detector"}>
          {t.mode_detector}
        </ModeButton>
        <ModeButton href="/factcheck" active={mode === "factcheck"}>
          {t.mode_factcheck}
        </ModeButton>
        <ModeButton href="/neutrality" active={mode === "neutrality"}>
          {t.mode_neutrality}
        </ModeButton>
        <ModeButton href="/explain" active={mode === "explain"}>
          {t.mode_explain}
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
            aria-label={t.tab_live}
            title={t.tab_live}
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
        <label className="flex flex-col items-center justify-center border border-dashed border-rule rounded-md py-8 sm:py-10 cursor-pointer hover:bg-background/40 transition-colors">
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

      {/* Explanation level — only in explain mode. Picks the audience the
          paragraph-by-paragraph explanations are written for. */}
      {mode === "explain" && (
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-muted">
            {t.explain_level}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {EXPLAIN_LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevel(lvl)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm border transition-colors",
                  level === lvl
                    ? "border-foreground bg-foreground text-background"
                    : "border-rule text-muted hover:text-foreground",
                )}
              >
                {t[`level_${lvl}` as keyof Messages] as string}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Model picker — shown as flag-prefixed pills. Each model has a
          country-of-origin flag so the user sees they're picking between a
          US model and a Chinese model. The same prompt is sent either way
          (apart from per-model tool_choice / provider-pin quirks). */}
      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wide text-muted">
          {t.model}
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {MODEL_CATALOG.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setModel(m.id)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm border transition-colors inline-flex items-center gap-2",
                model === m.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-rule text-muted hover:text-foreground",
              )}
            >
              {m.flag && <span className="text-base leading-none">{m.flag}</span>}
              {m.label}
            </button>
          ))}
        </div>
      </div>

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
