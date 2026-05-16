"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

type Tab = "url" | "text" | "file";

export function UploadForm() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [provider, setProvider] = useState<"anthropic" | "openai">("anthropic");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      let res: Response;
      if (tab === "file") {
        if (!file) throw new Error("Choose a PDF or TXT file");
        const fd = new FormData();
        fd.set("file", file);
        fd.set("provider", provider);
        res = await fetch("/api/analyze", { method: "POST", body: fd });
      } else {
        const body =
          tab === "url"
            ? { type: "url", url, provider }
            : { type: "text", text, provider };
        res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }
      const data = (await res.json()) as { id: string };
      startTransition(() => router.push(`/a/${data.id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const isPending = pending;

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 bg-paper border border-rule rounded-lg p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <TabButton active={tab === "url"} onClick={() => setTab("url")}>URL</TabButton>
        <TabButton active={tab === "text"} onClick={() => setTab("text")}>Paste text</TabButton>
        <TabButton active={tab === "file"} onClick={() => setTab("file")}>PDF / TXT</TabButton>

        <div className="ml-auto flex items-center gap-2 text-sm">
          <label htmlFor="provider" className="text-muted">Model</label>
          <select
            id="provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value as "anthropic" | "openai")}
            className="bg-background border border-rule rounded-md px-2 py-1"
          >
            <option value="anthropic">Claude (Anthropic)</option>
            <option value="openai">GPT (OpenAI)</option>
          </select>
        </div>
      </div>

      {tab === "url" && (
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/article"
          className="w-full bg-background border border-rule rounded-md px-3 py-2 outline-none focus:border-accent"
        />
      )}

      {tab === "text" && (
        <textarea
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder="Paste the text you want to analyze…"
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
            {file ? file.name : "Drop a PDF or TXT, or click to choose"}
          </span>
          {!file && <span className="text-sm text-muted mt-1">Max ~60k characters analyzed</span>}
        </label>
      )}

      {error && (
        <p className="text-sm text-[var(--severity-high)]">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">
          Analysis takes ~10–30s. Don&apos;t close the page.
        </span>
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "px-5 py-2 rounded-md bg-foreground text-background font-medium",
            "hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {isPending ? "Analyzing…" : "Analyze"}
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
