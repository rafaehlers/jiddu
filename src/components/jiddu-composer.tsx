"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { UploadForm } from "@/components/upload-form";
import { readSse } from "@/lib/sse";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

type StreamingState = {
  id: string | null;
  chunkCount: number;
  chunksDone: number;
  findingsCount: number;
};

type LiveState =
  | { status: "streaming"; data: StreamingState }
  | { status: "failed"; error: string };

export function JidduComposer() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const [live, setLive] = useState<LiveState | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function startStream(_text: string, body: BodyInit, contentType: string | null) {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLive({
      status: "streaming",
      data: { id: null, chunkCount: 0, chunksDone: 0, findingsCount: 0 },
    });

    const res = await fetch("/api/analyze", {
      method: "POST",
      body,
      headers: contentType ? { "content-type": contentType } : undefined,
      signal: ctrl.signal,
    });
    if (!res.ok || !res.body) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? `Request failed (${res.status})`);
    }

    for await (const ev of readSse(res, ctrl.signal)) {
      if (ev.event === "meta") {
        const meta = JSON.parse(ev.data) as { id: string; chunkCount: number };
        setLive((prev) =>
          prev?.status === "streaming"
            ? {
                status: "streaming",
                data: { ...prev.data, id: meta.id, chunkCount: meta.chunkCount },
              }
            : prev,
        );
      } else if (ev.event === "finding") {
        setLive((prev) =>
          prev?.status === "streaming"
            ? {
                status: "streaming",
                data: { ...prev.data, findingsCount: prev.data.findingsCount + 1 },
              }
            : prev,
        );
      } else if (ev.event === "chunkDone") {
        setLive((prev) =>
          prev?.status === "streaming"
            ? {
                status: "streaming",
                data: { ...prev.data, chunksDone: prev.data.chunksDone + 1 },
              }
            : prev,
        );
      } else if (ev.event === "done") {
        const d = JSON.parse(ev.data) as { id: string };
        router.replace(`/a/${d.id}`);
        return;
      } else if (ev.event === "error") {
        const d = JSON.parse(ev.data) as { error: string };
        setLive({ status: "failed", error: d.error });
        return;
      }
    }
  }

  if (!live) {
    return (
      <section className="mx-auto max-w-3xl w-full px-6 py-16 flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <h1 className="font-serif text-4xl md:text-5xl leading-tight text-balance">
            {t.hero_title}
          </h1>
          <p className="text-muted text-lg max-w-2xl">{t.hero_subtitle}</p>
        </div>
        <UploadForm onSubmit={startStream} />
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-muted">{t.see_demo_hint}</span>
          <Link
            href={`/a/demo-${lang}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-rule hover:border-foreground transition-colors"
          >
            {t.see_demo} <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="text-sm text-muted">
          <span className="font-medium text-foreground">{t.privacy}</span> {t.privacy_body}
        </div>
      </section>
    );
  }

  if (live.status === "failed") {
    return (
      <section className="mx-auto max-w-3xl w-full px-6 py-16 flex flex-col gap-6">
        <h2 className="font-serif text-2xl">{t.analysis_failed}</h2>
        <p className="text-[var(--severity-high)]">{live.error}</p>
        <div>
          <button
            type="button"
            onClick={() => setLive(null)}
            className="px-4 py-2 rounded-md bg-foreground text-background"
          >
            {t.try_again}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl w-full px-6 py-16 flex flex-col gap-10">
      <LoadingPanel state={live.data} />
    </section>
  );
}

function LoadingPanel({ state }: { state: StreamingState }) {
  const { t } = useI18n();
  const { chunkCount, chunksDone, findingsCount } = state;
  const known = chunkCount > 0;
  const pct = known ? Math.round((chunksDone / chunkCount) * 100) : 0;
  const stage = !known
    ? t.loading_reading
    : chunksDone === 0
      ? t.loading_starting
      : chunksDone < chunkCount
        ? t.loading_analyzing(chunksDone, chunkCount)
        : t.loading_finalizing;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-6 bg-paper border border-rule rounded-lg p-10 shadow-sm text-center"
    >
      <Loader2 className="h-7 w-7 animate-spin text-muted" />

      <div className="flex flex-col gap-1">
        <p className="font-serif text-2xl">{stage}…</p>
        <p className="text-sm text-muted">{t.loading_hint}</p>
      </div>

      {known && (
        <div className="w-full max-w-md flex flex-col gap-2">
          <div className="h-1.5 rounded-full bg-rule overflow-hidden">
            <div
              className={cn("h-full bg-[var(--accent)] transition-all duration-500 ease-out")}
              style={{ width: `${Math.max(pct, 4)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted tabular-nums">
            <span>
              {chunksDone}/{chunkCount} {t.sections}
            </span>
            <span>{t.fallacies_found_so_far(findingsCount)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
