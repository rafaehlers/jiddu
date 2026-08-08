"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CornerRightUp } from "lucide-react";
import { AnalysisLoadingDialog } from "@/components/analysis-loading-dialog";
import { UploadForm, type UploadSourceType } from "@/components/upload-form";
import { ModeCards } from "@/components/mode-cards";
import { AnalysisSkeleton } from "@/components/analysis-skeleton";
import { SignupCta } from "@/components/auth-controls";
import { PageTitle } from "@/components/page-title";
import { prematureSseEndMessage, readSse } from "@/lib/sse";
import { useI18n } from "@/lib/i18n/provider";
import type { Messages } from "@/lib/i18n/messages";

type Mode =
  "detector" | "factcheck" | "neutrality" | "explain" | "slop" | "review";

type StreamingState = {
  id: string | null;
  chunkCount: number;
  chunksDone: number;
  itemsCount: number;
  sourceType: UploadSourceType;
  stageName: string | null;
};

type LiveState =
  | { status: "streaming"; data: StreamingState }
  | { status: "failed"; error: string };

type SubmitErrorState = { message: string; code?: string };

/**
 * Per-mode wiring for the unified composer. The pipelines share the
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
      sourceType: UploadSourceType,
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
        sourceType === "image"
          ? t.loader_image
          : sourceType === "url"
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
    pools: (t, sourceType) => ({
      preMeta:
        sourceType === "image" ? t.loader_image : [t.loader_factcheck[0]],
      analysis: t.loader_factcheck,
    }),
  },
  neutrality: {
    path: "/neutrality",
    endpoint: "/api/neutrality",
    resultPrefix: "/n",
    countEvent: "finding",
    submitLabel: (t) => t.assess_neutrality,
    failedTitle: (t) => t.neutrality_failed,
    countLabels: (t) => [t.findings_found_one, t.findings_found_many],
    pools: (t, sourceType) => ({
      preMeta:
        sourceType === "image" ? t.loader_image : [t.loader_neutrality[0]],
      analysis: t.loader_neutrality,
    }),
  },
  explain: {
    path: "/explain",
    endpoint: "/api/explain",
    resultPrefix: "/e",
    countEvent: "finding",
    submitLabel: (t) => t.explain_cta,
    failedTitle: (t) => t.explain_failed,
    countLabels: (t) => [t.explanations_count_one, t.explanations_count_many],
    pools: (t, sourceType) => ({
      preMeta: sourceType === "image" ? t.loader_image : [t.loader_explain[0]],
      analysis: t.loader_explain,
    }),
  },
  slop: {
    path: "/slop",
    endpoint: "/api/slop",
    resultPrefix: "/s",
    countEvent: "finding",
    submitLabel: (t) => t.check_slop,
    failedTitle: (t) => t.slop_failed,
    countLabels: (t) => [t.slop_found_one, t.slop_found_many],
    pools: (t, sourceType) => ({
      preMeta: sourceType === "image" ? t.loader_image : [t.loader_slop[0]],
      analysis: t.loader_slop,
    }),
  },
  review: {
    path: "/review",
    endpoint: "/api/review",
    resultPrefix: "/r",
    countEvent: "__none__",
    submitLabel: (t) => t.review_cta,
    failedTitle: (t) => t.review_failed,
    countLabels: null,
    pools: (t) => ({
      preMeta: [t.loader_review[0]],
      analysis: t.loader_review,
    }),
  },
};

/**
 * Unified home — one hero, six lens cards as the form mode selector, plus
 * dedicated Live and Context cards. Switching form lenses is pure client
 * state (no navigation); the URL is kept in sync via history.replaceState so the
 * feature routes still work as deep links and SEO entry points.
 */
export function HomeComposer({
  initialMode = "detector",
  showOriginNote = false,
  showSignupCta = false,
}: {
  initialMode?: Mode;
  showOriginNote?: boolean;
  showSignupCta?: boolean;
}) {
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
  const modeLabel: Record<Mode, string> = {
    detector: t.mode_detector,
    factcheck: t.mode_factcheck,
    neutrality: t.mode_neutrality,
    explain: t.mode_explain,
    slop: t.mode_slop,
    review: t.mode_review,
  };

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setSubmitError(null);
    // Sync the address bar without a navigation so the lenses stay
    // deep-linkable. replaceState (not push) — flipping through lenses is
    // not a journey the back button should retrace.
    window.history.replaceState(null, "", MODE_CONFIG[next].path);
  }

  async function startStream(
    sourceType: UploadSourceType,
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
        itemsCount: 0,
        sourceType,
        stageName: null,
      },
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
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        code?: string;
      } | null;
      setLive(null);
      setSubmitError({
        message: data?.error ?? `Request failed (${res.status})`,
        code: data?.code ?? "request_failed",
      });
      return;
    }

    if (mode === "review") {
      const job = (await res.json().catch(() => null)) as {
        id?: string;
        viewerUrl?: string;
      } | null;
      if (!job?.id) {
        setLive(null);
        setSubmitError({
          message: "The review job was created without a valid id.",
          code: "invalid_job_response",
        });
        return;
      }
      abortRef.current = null;
      router.replace(job.viewerUrl ?? `${cfg.resultPrefix}/${job.id}`);
      return;
    }

    for await (const ev of readSse(
      res,
      ctrl.signal,
      prematureSseEndMessage(lang),
    )) {
      if (ev.event === "meta") {
        const meta = JSON.parse(ev.data) as { id: string; chunkCount: number };
        setLive((prev) =>
          prev?.status === "streaming"
            ? {
                status: "streaming",
                data: {
                  ...prev.data,
                  id: meta.id,
                  chunkCount: meta.chunkCount,
                },
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
      } else if (ev.event === "stage") {
        const data = JSON.parse(ev.data) as { name?: string };
        setLive((prev) =>
          prev?.status === "streaming"
            ? {
                status: "streaming",
                data: { ...prev.data, stageName: data.name ?? null },
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
        {/* Standard hero — the same for all lenses, so switching a
            lens never reflows the top of the page. */}
        <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-x-4 gap-y-4 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-x-8 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-x-12">
          <div className="col-start-1 row-start-1 flex w-24 flex-col items-center gap-2 sm:row-span-2 sm:w-28 md:w-40">
            <span
              className="relative size-20 shrink-0 sm:size-28 md:size-40"
              aria-hidden="true"
            >
              <Image
                src="/brand/jiddu_logo_inverted_256.webp"
                alt=""
                fill
                sizes="(min-width: 768px) 160px, (min-width: 640px) 112px, 80px"
                className="jiddu-brand-logo jiddu-brand-logo-inverted object-cover mix-blend-lighten"
                priority
              />
              <Image
                src="/brand/jiddu_logo_256.webp"
                alt=""
                fill
                sizes="(min-width: 768px) 160px, (min-width: 640px) 112px, 80px"
                className="jiddu-brand-logo jiddu-brand-logo-default object-cover mix-blend-darken"
                priority
              />
            </span>
            <p className="text-center font-serif text-xs italic leading-snug text-muted sm:text-sm">
              “{t.hero_quote}”
            </p>
          </div>
          <PageTitle className="col-start-2 row-start-1">
            {t.hero_title}
          </PageTitle>
          <p className="col-span-2 row-start-2 max-w-3xl text-base leading-relaxed text-foreground/85 sm:col-span-1 sm:col-start-2 sm:text-lg">
            {t.home_hero_subtitle}
          </p>
        </div>

        <ModeCards mode={mode} onChange={switchMode} />

        {showSignupCta ? (
          <div className="max-w-3xl">
            <div className="flex flex-col gap-3 sm:flex-row">
              <SignupCta />
              <Link
                href={`${cfg.resultPrefix}/demo-${lang}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-rule bg-paper px-5 py-3 font-semibold text-foreground transition-colors hover:border-accent-edge"
              >
                {t.see_demo_for(modeLabel[mode])} <span aria-hidden>→</span>
              </Link>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
              {t.see_demo_hint}
              <CornerRightUp className="size-4 shrink-0" aria-hidden />
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">{t.see_demo_hint}</span>
            <Link
              href={`${cfg.resultPrefix}/demo-${lang}`}
              className="inline-flex items-center gap-1 rounded-md border border-rule px-3 py-1.5 transition-colors hover:border-foreground"
            >
              {t.see_demo_for(modeLabel[mode])} <span aria-hidden>→</span>
            </Link>
          </div>
        )}

        <UploadForm
          key={mode}
          onSubmit={startStream}
          error={submitError}
          onClearError={() => setSubmitError(null)}
          submitLabel={cfg.submitLabel(t)}
          mode={mode}
          showModeTabs={false}
        />

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

        {showOriginNote && (
          <aside
            className="rounded-lg border border-rule p-5"
            aria-labelledby="home-origin-heading"
          >
            <h2
              id="home-origin-heading"
              className="font-serif text-2xl text-foreground"
            >
              {t.home_origin_heading}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
              {t.home_origin_before_name}{" "}
              <a
                href="https://en.wikipedia.org/wiki/Jiddu_Krishnamurti"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                Jiddu Krishnamurti
              </a>
              {t.home_origin_after_name} <em>{t.home_origin_quote}</em>{" "}
              {t.home_origin_explanation}
            </p>
          </aside>
        )}
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

  // Streaming: instead of a bare loading panel, land the user on what looks
  // like the result page already assembling — the skeleton of the viewer
  // layout pulsing underneath, with the progress messages floating above it
  // as a modal. When "done" fires we navigate; the result page mounts with
  // the same skeleton and reveals the real content (SkeletonReveal), so the
  // whole flow reads as one continuous materialization.
  return (
    <div className="relative flex-1 flex flex-col">
      <AnalysisSkeleton />
      <LoadingModal state={live.data} mode={mode} />
    </div>
  );
}

function LoadingModal({ state, mode }: { state: StreamingState; mode: Mode }) {
  const { t } = useI18n();
  const cfg = MODE_CONFIG[mode];
  const { chunkCount, chunksDone, itemsCount, sourceType, stageName } = state;
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
    if (mode === "review" && stageName) {
      const stageIndex: Record<string, number> = {
        ledger: 1,
        research: 2,
        specs: 3,
        verification: 4,
        synthesis: 5,
        self_critique: 6,
        source_validation: 7,
        quality_audit: 8,
        finalize: 9,
      };
      stage = analysis[stageIndex[stageName] ?? tick % analysis.length];
    } else {
      stage = analysis[tick % analysis.length];
    }
  } else {
    stage = t.loading_finalizing;
  }

  const labels = cfg.countLabels?.(t);

  // Non-dismissable progress dialog floating over the skeleton page. The
  // scrim keeps the pulsing result skeleton visible behind it.
  return (
    <AnalysisLoadingDialog
      stage={stage}
      detail={
        labels && itemsCount > 0
          ? `${itemsCount} ${itemsCount === 1 ? labels[0] : labels[1]}`
          : mode === "review"
            ? t.review_form_hint
            : t.loading_hint
      }
    />
  );
}
