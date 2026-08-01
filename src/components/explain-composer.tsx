"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  UploadForm,
  type UploadSourceType,
} from "@/components/upload-form";
import { PipelineSidebar } from "@/components/pipeline-sidebar";
import { readSse } from "@/lib/sse";
import { useI18n } from "@/lib/i18n/provider";

type StreamingState = {
  id: string | null;
  chunkCount: number;
  chunksDone: number;
  findingsCount: number;
  synthesizing: boolean;
};

type LiveState =
  | { status: "streaming"; data: StreamingState }
  | { status: "failed"; error: string };

type SubmitErrorState = { message: string; code?: string };

export function ExplainComposer() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const [live, setLive] = useState<LiveState | null>(null);
  const [submitError, setSubmitError] = useState<SubmitErrorState | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function startStream(
    _sourceType: UploadSourceType,
    body: BodyInit,
    contentType: string | null,
  ) {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setSubmitError(null);
    setLive({
      status: "streaming",
      data: {
        id: null,
        chunkCount: 0,
        chunksDone: 0,
        findingsCount: 0,
        synthesizing: false,
      },
    });

    let res: Response;
    try {
      res = await fetch("/api/explain", {
        method: "POST",
        body,
        headers: contentType ? { "content-type": contentType } : undefined,
        signal: ctrl.signal,
      });
    } catch (err) {
      setLive(null);
      setSubmitError({
        message: err instanceof Error ? err.message : "Request failed",
        code: "request_failed",
      });
      return;
    }
    if (!res.ok || !res.body) {
      const data = (await res.json().catch(() => null)) as
        | { error?: string; code?: string }
        | null;
      setLive(null);
      setSubmitError({
        message: data?.error ?? `Request failed (${res.status})`,
        code: data?.code ?? "request_failed",
      });
      return;
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
      } else if (ev.event === "synthesisStart") {
        setLive((prev) =>
          prev?.status === "streaming"
            ? {
                status: "streaming",
                data: { ...prev.data, synthesizing: true },
              }
            : prev,
        );
      } else if (ev.event === "done") {
        const d = JSON.parse(ev.data) as { id: string };
        router.replace(`/e/${d.id}`);
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
      <section className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-8 sm:py-14">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 lg:items-start">
          <div className="flex-1 min-w-0 flex flex-col gap-8 sm:gap-10 order-1">
            <div className="flex flex-col gap-4">
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight text-balance">
                {t.explain_hero_title}
              </h1>
              <p className="text-muted text-base sm:text-lg max-w-2xl">
                {t.explain_hero_subtitle}
              </p>
            </div>
            <UploadForm
              onSubmit={startStream}
              error={submitError}
              onClearError={() => setSubmitError(null)}
              submitLabel={t.explain_cta}
              mode="explain"
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
              <span className="text-muted">{t.see_demo_hint}</span>
              <Link
                href={`/e/demo-${lang}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-rule hover:border-foreground transition-colors self-start sm:self-auto"
              >
                {t.see_demo} <span aria-hidden>→</span>
              </Link>
            </div>
            <div className="text-sm text-muted">
              <span className="font-medium text-foreground">{t.privacy}</span>{" "}
              {t.privacy_body}
            </div>
          </div>
          <PipelineSidebar activeMode="explain" />
        </div>
      </section>
    );
  }

  if (live.status === "failed") {
    return (
      <section className="mx-auto max-w-3xl w-full px-6 py-16 flex flex-col gap-6">
        <h2 className="font-serif text-2xl">{t.explain_failed}</h2>
        <p className="text-[var(--severity-high)]">{live.error}</p>
        <div>
          <button
            type="button"
            onClick={() => setLive(null)}
            className="px-4 py-2 rounded-md bg-accent text-white"
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
  const { chunkCount, chunksDone, findingsCount, synthesizing } = state;
  const known = chunkCount > 0;
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 2500);
    return () => clearInterval(id);
  }, []);

  const pool = t.loader_explain;
  let stage: string;
  if (!known) {
    stage = pool[0];
  } else if (chunksDone < chunkCount) {
    stage = pool[tick % pool.length];
  } else if (synthesizing) {
    stage = t.loader_explain_map;
  } else {
    stage = t.loading_finalizing;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-6 bg-paper border border-rule rounded-lg p-10 shadow-sm text-center"
    >
      <Loader2 className="h-7 w-7 animate-spin text-muted" />
      <div className="flex flex-col gap-1 min-h-[3.5rem]">
        <p className="font-serif text-2xl transition-opacity duration-200">
          {stage}…
        </p>
        <p className="text-sm text-muted">
          {findingsCount > 0
            ? `${findingsCount} ${findingsCount === 1 ? t.explanations_count_one : t.explanations_count_many}`
            : t.loading_hint}
        </p>
      </div>
    </div>
  );
}
