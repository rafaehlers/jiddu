"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, Play, Square, ExternalLink, RotateCcw } from "lucide-react";
import { AnalysisAuthModal } from "@/components/analysis-auth-modal";
import { useLiveSession, type LiveSource } from "@/lib/live/use-live-session";
import { useLiveAnalysis } from "@/lib/live/use-live-analysis";
import { useI18n } from "@/lib/i18n/provider";
import { SourcePicker } from "./source-picker";
import { TranscriptStream } from "./transcript-stream";
import { FindingsList } from "./findings-list";

// Hard cap: stop the session after this many seconds to prevent runaway cost.
// 60 minutes ≈ $1 of gpt-live-transcribe at $0.017/min, before LLM analysis.
const MAX_SESSION_MS = 60 * 60 * 1000;

export function LivePage() {
  // Use the site-wide language preference (selector lives in the header) so
  // both the transcription hint and the LLM analysis output language
  // follow the rest of the UI.
  const { lang, t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const [source, setSource] = useState<LiveSource>("mic");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const session = useLiveSession({ language: lang });
  const analysis = useLiveAnalysis({
    transcript: session.transcript,
    active: session.state === "live",
    language: lang,
  });

  const isRunning = session.state === "live" || session.state === "connecting";
  const reachedHardLimit =
    session.state === "live" && session.elapsedMs >= MAX_SESSION_MS;
  // A session is "concluded" when we've stopped recording AND the LLM
  // finalized; the user can then view the persisted analysis or start over.
  const hasConcludedSession =
    (session.state === "stopped" || session.state === "error") &&
    analysis.sessionId != null;

  const handleStart = () => {
    if (authLoading) return;
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    void session.start(source);
  };

  const handleStop = async () => {
    // Stop capturing audio first so finalize gets the full transcript and
    // no more deltas arrive while we wait for the LLM. We intentionally
    // do NOT redirect on success — the user sees a "session saved" banner
    // here, can review findings, and chooses to view the full analysis or
    // start a new recording.
    await session.stop();
    await analysis.finalize();
  };

  // Auto-stop on hard limit.
  if (reachedHardLimit) {
    void handleStop();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12 flex-1 w-full">
      <header className="mb-6">
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif text-3xl sm:text-4xl tracking-tight">
            Jiddu Live
          </h1>
          <span className="text-xs uppercase tracking-wider text-accent border border-accent/40 rounded px-1.5 py-0.5">
            beta
          </span>
        </div>
        <p className="text-muted mt-2 text-sm sm:text-base">
          {t.live_subtitle}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SourcePicker value={source} onChange={setSource} disabled={isRunning} />
        <span className="text-xs text-muted">
          {t.live_language_follows_header}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {!isRunning ? (
          <button
            type="button"
            onClick={handleStart}
            disabled={authLoading}
            className="inline-flex items-center gap-2 rounded-md bg-accent text-white px-4 py-2 text-sm font-medium hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
          >
            {hasConcludedSession ? (
              <>
                <RotateCcw className="size-4" />
                {t.live_start_new}
              </>
            ) : (
              <>
                <Play className="size-4" />
                {t.live_start}
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStop}
            disabled={session.state === "stopping"}
            className="inline-flex shrink-0 items-center gap-2 rounded-md border border-severity-high bg-severity-high px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
          >
            <Square className="size-4" />
            {t.live_stop}
          </button>
        )}

        <StatusBadge
          state={session.state}
          elapsedMs={session.elapsedMs}
          isAnalyzing={analysis.isAnalyzing}
        />
      </div>

      {hasConcludedSession && (
        <div className="mb-4 rounded-md border border-accent/40 bg-accent/10 text-foreground px-3 py-2 text-sm flex items-center justify-between gap-3 flex-wrap">
          <span>{t.live_session_saved}</span>
          <Link
            href={`/a/${analysis.sessionId}`}
            className="inline-flex items-center gap-1.5 text-accent hover:underline font-medium"
          >
            {t.live_view_analysis}
            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      )}

      {(session.error || analysis.error) && (
        <div className="mb-4 rounded-md border border-severity-high/50 bg-severity-high/10 text-foreground px-3 py-2 text-sm">
          {session.error ?? analysis.error}
        </div>
      )}

      <TranscriptStream
        transcript={session.transcript}
        active={session.state === "live"}
      />

      <section className="mt-6">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-xl tracking-tight">
            {t.live_findings}{" "}
            <span className="text-muted text-base">
              ({analysis.findings.length})
            </span>
          </h2>
          {analysis.score != null && (
            <span className="text-sm text-muted">
              {t.live_running_score}:{" "}
              <strong className="text-foreground">{analysis.score}</strong>
              /100
            </span>
          )}
        </div>
        <FindingsList findings={analysis.findings} lang={lang} />
      </section>

      <p className="text-xs text-muted mt-6">{t.live_privacy_note}</p>
      <AnalysisAuthModal
        open={authModalOpen}
        returnTo={pathname}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

function StatusBadge({
  state,
  elapsedMs,
  isAnalyzing,
}: {
  state: ReturnType<typeof useLiveSession>["state"];
  elapsedMs: number;
  isAnalyzing: boolean;
}) {
  const { t } = useI18n();
  if (state === "connecting") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-muted">
        <Loader2 className="size-3.5 animate-spin" />
        {t.live_status_connecting}
      </span>
    );
  }
  if (state === "live") {
    return (
      <span className="inline-flex items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 text-accent">
          <span className="inline-block size-2 rounded-full bg-accent animate-pulse" />
          {t.live_status_live} · {formatDuration(elapsedMs)}
        </span>
        {isAnalyzing && (
          <span className="inline-flex items-center gap-1 text-muted">
            <Loader2 className="size-3 animate-spin" />
            {t.live_status_analyzing}
          </span>
        )}
      </span>
    );
  }
  if (state === "stopping") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-muted">
        <Loader2 className="size-3.5 animate-spin" />
        {t.live_status_finalizing}
      </span>
    );
  }
  if (state === "stopped") {
    return (
      <span className="text-sm text-muted">
        {t.live_status_stopped} · {formatDuration(elapsedMs)}
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="text-sm text-severity-high">{t.live_status_error}</span>
    );
  }
  return null;
}

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
