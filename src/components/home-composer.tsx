"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { UploadForm } from "@/components/upload-form";
import { ModeCards } from "@/components/mode-cards";
import { readSse } from "@/lib/sse";
import { useI18n } from "@/lib/i18n/provider";
import type { Messages } from "@/lib/i18n/messages";

type Mode = "detector" | "factcheck" | "neutrality" | "explain";
type SourceType = "url" | "text" | "file";

type StreamingState = {
  id: string | null;
  chunkCount: number;
  chunksDone: number;
  itemsCount: number;
  sourceType: SourceType;
};

type LiveState =
  | { status: "streaming"; data: StreamingState }
  | { status: "failed"; error: string };

type SubmitErrorState = { message: string; code?: string };

/**
 * Per-mode wiring for the unified composer. The four pipelines share the
 * same SSE contract (meta → per-item events → chunkDone → done/error); they
 * differ only in endpoint, result-page prefix, the name of the per-item
 * event, and copy. Everything t-dependent is resolved lazily so the panel
 * re-renders correctly on language switch.
 */
const MODE_CONFIG: Record<
  Mode,
  {
    path: string;
    endpoint: string;
    resultPrefix: string;
    countEvent: string;
    submitLabel: (t: Messages) => string | undefined;
    failedTitle: (t: Messages) => string;
    countLabels: ((t: Messages) => [string, string]) | null;
    pools: (
      t: Messages,
      sourceType: SourceType,
    ) => { preMeta: string[]; analysis: string[] };
  }
> = {
  detector: {
    path: "/",
    endpoint: "/api/analyze",
    resultPrefix: "/a",
    countEvent: "finding",
    submitLabel: () => undefined,
    failedTitle: (t) => t.analysis_failed,
    countLabels: null,
    pools: (t, sourceType) => ({
      preMeta:
        sourceType === "url"
          ? t.loader_url
          : sourceType === "file"
            ? t.loader_file
            : t.loader_paste,
      analysis: t.loader_analysis,
    }),
  },
  factcheck: {
    path: "/factcheck",
    endpoint: "/api/factcheck",
    resultPrefix: "/f",
    countEvent: "claim",
    submitLabel: (t) => t.extract_claims,
    failedTitle: (t) => t.factcheck_failed,
    countLabels: (t) => [t.claims_found_one, t.claims_found_many],
    pools: (t) => ({ preMeta: [t.loader_factcheck[0]], analysis: t.loader_factcheck }),
  },
  neutrality: {
    path: "/neutrality",
    endpoint: "/api/neutrality",
    resultPrefix: "/n",
    countEvent: "finding",
    submitLabel: (t) => t.assess_neutrality,
    failedTitle: (t) => t.neutrality_failed,
    countLabels: (t) => [t.findings_found_one, t.findings_found_many],
    pools: (t) => ({ preMeta: [t.loader_neutrality[0]], analysis: t.loader_neutrality }),
  },
  explain: {
    path: "/explain",
    endpoint: "/api/explain",
    resultPrefix: "/e",
    countEvent: "finding",
    submitLabel: (t) => t.explain_cta,
    failedTitle: (t) => t.explain_failed,
    countLabels: (t) => [t.explanations_count_one, t.explanations_count_many],
    pools: (t) => ({ preMeta: [t.loader_explain[0]], analysis: t.loader_explain }),
  },
};

/**
 * Unified home — one hero, the four lens cards as the mode selector, one
 * form. Switching lenses is pure client state (no navigation); the URL is
 * kept in sync via history.replaceState so /factcheck, /neutrality and
 * /explain still work as deep links and SEO entry points.
 */
export function HomeComposer({ initialMode = "detector" }: { initialMode?: Mode }) {
  const router = useRouter();
  const { t, lang } = useI18n();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [live, setLive] = useState<LiveState | null>(null);
  const [submitError, setSubmitError] = useState<SubmitErrorState | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const cfg = MODE_CONFIG[mode];

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setSubmitError(null);
    // Sync the address bar without a navigation so the four lenses stay
    // deep-linkable. replaceState (not push) — flipping through lenses is
    // not a journey the back button should retrace.
    window.history.replaceState(null, "", MODE_CONFIG[next].path);
  }

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
      data: { id: null, chunkCount: 0, chunksDone: 0, itemsCount: 0, sourceType },
    });

    let res: Response;
    try {
      res = await fetch(cfg.endpoint, {
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
      } else if (ev.event === cfg.countEvent) {
        setLive((prev) =>
          prev?.status === "streaming"
            ? {
                status: "streaming",
                data: { ...prev.data, itemsCount: prev.data.itemsCount + 1 },
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
        router.replace(`${cfg.resultPrefix}/${d.id}`);
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
      <section className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-8 sm:py-14 flex flex-col gap-8 sm:gap-10">
        {/* Standard hero — the same for all four lenses, so switching a
            lens never reflows the top of the page. */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-tight text-balance">
            {t.hero_title}
          </h1>
          <p className="text-foreground/85 text-base sm:text-lg max-w-3xl leading-relaxed">
            {t.home_hero_subtitle}
          </p>
        </div>

        <ModeCards mode={mode} onChange={switchMode} />

        <UploadForm
          onSubmit={startStream}
          error={submitError}
          onClearError={() => setSubmitError(null)}
          submitLabel={cfg.submitLabel(t)}
          mode={mode}
          showModeTabs={false}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
          <span className="text-muted">{t.see_demo_hint}</span>
          <Link
            href={`${cfg.resultPrefix}/demo-${lang}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-rule hover:border-foreground transition-colors self-start sm:self-auto"
          >
            {t.see_demo} <span aria-hidden>→</span>
          </Link>
        </div>

        {/* Benchmark quality card — fact-check only, as before. */}
        {mode === "factcheck" && (
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
              <span className="text-sm decoration-rule group-hover:decoration-foreground transition-colors self-start mt-0.5">
                {t.quality_card_link} <span aria-hidden>→</span>
              </span>
            </div>
          </Link>
        )}

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
        <h2 className="font-serif text-2xl">{cfg.failedTitle(t)}</h2>
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
      <LoadingPanel state={live.data} mode={mode} />
    </section>
  );
}

function LoadingPanel({ state, mode }: { state: StreamingState; mode: Mode }) {
  const { t } = useI18n();
  const cfg = MODE_CONFIG[mode];
  const { chunkCount, chunksDone, itemsCount, sourceType } = state;
  const known = chunkCount > 0;

  // Cycle a "tick" every 2.5s while loading so the stage label rotates even
  // if chunksDone doesn't advance.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 2500);
    return () => clearInterval(id);
  }, []);

  const { preMeta, analysis } = cfg.pools(t, sourceType);
  let stage: string;
  if (!known) {
    stage = preMeta[tick % preMeta.length];
  } else if (chunksDone < chunkCount) {
    stage = analysis[tick % analysis.length];
  } else {
    stage = t.loading_finalizing;
  }

  const labels = cfg.countLabels?.(t);

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
        <p className="text-sm text-muted">
          {labels && itemsCount > 0
            ? `${itemsCount} ${itemsCount === 1 ? labels[0] : labels[1]}`
            : t.loading_hint}
        </p>
      </div>
    </div>
  );
}
