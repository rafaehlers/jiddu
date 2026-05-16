"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

type Tab = "url" | "text" | "file";

type Props = {
  onSubmit: (text: string, body: BodyInit, contentType: string | null) => Promise<void>;
};

export function UploadForm({ onSubmit }: Props) {
  const { t, lang } = useI18n();
  const [tab, setTab] = useState<Tab>("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [provider, setProvider] = useState<"anthropic" | "openai">("anthropic");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (tab === "file") {
        if (!file) throw new Error("Choose a PDF or TXT file");
        const fd = new FormData();
        fd.set("file", file);
        fd.set("provider", provider);
        fd.set("lang", lang);
        await onSubmit("", fd, null);
      } else {
        const body = JSON.stringify(
          tab === "url"
            ? { type: "url", url, provider, lang }
            : { type: "text", text, provider, lang },
        );
        await onSubmit(tab === "text" ? text : "", body, "application/json");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 bg-paper border border-rule rounded-lg p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-2">
        <TabButton active={tab === "url"} onClick={() => setTab("url")}>{t.tab_url}</TabButton>
        <TabButton active={tab === "text"} onClick={() => setTab("text")}>{t.tab_paste}</TabButton>
        <TabButton active={tab === "file"} onClick={() => setTab("file")}>{t.tab_file}</TabButton>

        <div className="ml-auto flex items-center gap-2 text-sm">
          <label htmlFor="provider" className="text-muted">{t.model}</label>
          <select
            id="provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value as "anthropic" | "openai")}
            className="bg-background border border-rule rounded-md px-2 py-1"
          >
            <option value="anthropic">{t.model_anthropic}</option>
            <option value="openai">{t.model_openai}</option>
          </select>
        </div>
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

      {error && (
        <p className="text-sm text-[var(--severity-high)]">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">{t.form_hint}</span>
        <button
          type="submit"
          disabled={submitting}
          className={cn(
            "px-5 py-2 rounded-md bg-foreground text-background font-medium",
            "hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {submitting ? t.starting : t.analyze}
        </button>
      </div>
    </form>
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
