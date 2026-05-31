"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { UploadForm } from "@/components/upload-form";
import { readSse } from "@/lib/sse";
import { useI18n } from "@/lib/i18n/provider";

type SourceType = "url" | "text" | "file";

type StreamingState = {
  id: string | null;
  chunkCount: number;
  chunksDone: number;
  findingsCount: number;
  sourceType: SourceType;
};

type LiveState =
  | { status: "streaming"; data: StreamingState }
  | { status: "failed"; error: string };

type SubmitErrorState = { message: string; code?: string };

export function JidduComposer() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const [live, setLive] = useState<LiveState | null>(null);
  const [submitError, setSubmitError] = useState<SubmitErrorState | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function startStream(
    sourceType: SourceType,
    body: BodyInit,
    contentType: string | null,
  ) {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setSubmitError(null);
    setLive({
      status: "streaming",
      data: { id: null, chunkCount: 0, chunksDone: 0, findingsCount: 0, sourceType },
    });

    let res: Response;
    try {
      res = await fetch("/api/analyze", {
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
      <section className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-8 sm:py-14 flex flex-col gap-10 sm:gap-14">
        {/* Hero — just title + subtitle. The validation badge and the demo
            CTAs each get their own dedicated section below to give them
            room to breathe instead of crowding the hero. */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight text-balance">
            {t.hero_title}
          </h1>
          <p className="text-foreground/85 text-base sm:text-lg max-w-2xl leading-relaxed">
            {t.hero_subtitle}
          </p>
        </div>
        <UploadForm
          onSubmit={startStream}
          error={submitError}
          onClearError={() => setSubmitError(null)}
        />

        {/* Pipeline showcase — 3 cards explaining what each mode does
            and linking to a demo result. Stacks on mobile, side-by-side
            from md up. Demos use the user's current language. */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-xl sm:text-2xl">
              {t.pipelines_heading}
            </h2>
            <p className="text-sm text-muted">{t.pipelines_subheading}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {[
              {
                key: "fallacy",
                name: t.mode_detector,
                desc: t.pipeline_fallacy_desc,
                demo: `/a/demo-${lang}`,
              },
              {
                key: "factcheck",
                name: t.mode_factcheck,
                desc: t.pipeline_factcheck_desc,
                demo: `/f/demo-${lang}`,
              },
              {
                key: "neutrality",
                name: t.mode_neutrality,
                desc: t.pipeline_neutrality_desc,
                demo: `/n/demo-${lang}`,
              },
            ].map((p) => (
              <div
                key={p.key}
                className="flex flex-col gap-3 p-4 sm:p-5 bg-paper border border-rule rounded-lg"
              >
                <h3 className="font-serif text-lg">{p.name}</h3>
                <p className="text-sm text-foreground/80 leading-relaxed flex-1">
                  {p.desc}
                </p>
                <Link
                  href={p.demo}
                  className="text-sm self-start underline decoration-rule hover:decoration-foreground transition-colors"
                >
                  {t.see_demo} <span aria-hidden>→</span>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Quality signal card — promotes the PolitiFact benchmark to a
            full-width trust card. Visible to anyone weighing whether to
            trust an automated fact-checker. Stays subdued in tone (paper
            bg, single accent check) so it doesn't read as a sales claim. */}
        <Link
          href="/benchmark"
          className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 bg-paper border border-rule rounded-lg hover:border-foreground/40 transition-colors group"
        >
          <span
            aria-hidden
            className="text-[var(--severity-low)] text-xl leading-none mt-0.5"
          >
            ✓
          </span>
          <div className="flex flex-col gap-1.5 flex-1">
            <h3 className="text-sm font-medium text-foreground">
              {t.quality_card_heading}
            </h3>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {t.quality_card_body}
            </p>
            <span className="text-sm underline decoration-rule group-hover:decoration-foreground transition-colors self-start mt-0.5">
              {t.quality_card_link} <span aria-hidden>→</span>
            </span>
          </div>
        </Link>

        <div className="text-sm text-muted">
          <span className="font-medium text-foreground">{t.privacy}</span>{" "}
          {t.privacy_body}
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
  const { chunkCount, chunksDone, sourceType } = state;
  const known = chunkCount > 0;

  // Cycle a "tick" every 2.5s while loading so the stage label rotates even if
  // chunksDone doesn't advance. Each phase (pre-meta / per-chunk analysis) has
  // its own pool of friendly copy.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 2500);
    return () => clearInterval(id);
  }, []);

  const preMetaPool =
    sourceType === "url"
      ? t.loader_url
      : sourceType === "file"
        ? t.loader_file
        : t.loader_paste;

  let stage: string;
  if (!known) {
    stage = preMetaPool[tick % preMetaPool.length];
  } else if (chunksDone < chunkCount) {
    const pool = t.loader_analysis;
    stage = pool[tick % pool.length];
  } else {
    stage = t.loading_finalizing;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-5 sm:gap-6 bg-paper border border-rule rounded-lg px-6 py-8 sm:p-10 shadow-sm text-center"
    >
      <Loader2 className="h-6 w-6 sm:h-7 sm:w-7 animate-spin text-muted" />

      <div className="flex flex-col gap-1 min-h-[3.5rem]">
        <p className="font-serif text-xl sm:text-2xl transition-opacity duration-200">
          {stage}…
        </p>
        <p className="text-sm text-muted">{t.loading_hint}</p>
      </div>
    </div>
  );
}
