"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, Play, Square, ExternalLink, RotateCcw } from "lucide-react";
import { AnalysisAuthModal } from "@/components/analysis-auth-modal";
import { useLiveSession, type LiveSource } from "@/lib/live/use-live-session";
import type { LiveSessionError } from "@/lib/live/use-live-session";
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
    billingReservationId: session.billingReservationId,
    transcript: session.transcript,
    active: session.state === "live",
    language: lang,
  });

  const isRunning =
    session.state === "live" ||
    session.state === "connecting" ||
    session.state === "stopping";
  const reachedHardLimit =
    session.state === "live" && session.elapsedMs >= MAX_SESSION_MS;
  const autoStopTriggeredRef = useRef(false);
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

  const handleStop = useCallback(async () => {
    // Stop capturing audio first so finalize gets the full transcript and
    // no more deltas arrive while we wait for the LLM. We intentionally
    // do NOT redirect on success — the user sees a "session saved" banner
    // here, can review findings, and chooses to view the full analysis or
    // start a new recording.
    const audioDurationMs = await session.stop();
    const analysisId = await analysis.finalize(audioDurationMs);
    await session.finish(analysisId);
  }, [analysis, session]);

  // Auto-stop on hard limit.
  useEffect(() => {
    if (!reachedHardLimit) {
      autoStopTriggeredRef.current = false;
      return;
    }
    if (autoStopTriggeredRef.current) return;
    autoStopTriggeredRef.current = true;
    void handleStop();
  }, [reachedHardLimit, handleStop]);

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
        <LiveErrorNotice
          error={session.error}
          hasAnalysisError={Boolean(analysis.error)}
          lang={lang}
        />
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

const LIVE_ERROR_COPY = {
  en: {
    creditsTitle: "You need more credits",
    creditsBody: (required?: number, available?: number) =>
      required !== undefined && available !== undefined
        ? `Jiddu Live needs ${required} credits to start. You have ${available} available.`
        : "Your current balance is not enough to start Jiddu Live.",
    buyCredits: "Buy credits",
    permissionTitle: "Allow microphone access",
    permissionBody:
      "Give Jiddu permission to use your microphone, then try again.",
    microphoneTitle: "We couldn’t find a microphone",
    microphoneBody: "Connect or enable a microphone, then try again.",
    tabTitle: "Tab audio isn’t available",
    tabUnsupported:
      "Use Chrome or Edge if you want to transcribe audio from another tab.",
    tabAudioMissing:
      "Choose the tab again and make sure “Share audio” is turned on.",
    cancelledTitle: "Sharing was cancelled",
    cancelledBody: "Choose a source and start again when you’re ready.",
    connectionTitle: "The connection was interrupted",
    connectionBody: "Check your internet connection and try again.",
    genericTitle: "Jiddu Live couldn’t start",
    genericBody: "Please try again in a moment.",
  },
  pt: {
    creditsTitle: "Você precisa de mais créditos",
    creditsBody: (required?: number, available?: number) =>
      required !== undefined && available !== undefined
        ? `O Jiddu Live precisa de ${required} créditos para iniciar. Você tem ${available} disponíveis.`
        : "Seu saldo atual não é suficiente para iniciar o Jiddu Live.",
    buyCredits: "Comprar créditos",
    permissionTitle: "Permita o acesso ao microfone",
    permissionBody:
      "Autorize o Jiddu a usar seu microfone e tente novamente.",
    microphoneTitle: "Não encontramos um microfone",
    microphoneBody: "Conecte ou ative um microfone e tente novamente.",
    tabTitle: "O áudio da aba não está disponível",
    tabUnsupported:
      "Use o Chrome ou o Edge para transcrever o áudio de outra aba.",
    tabAudioMissing:
      "Escolha a aba novamente e ative a opção “Compartilhar áudio”.",
    cancelledTitle: "O compartilhamento foi cancelado",
    cancelledBody: "Escolha uma fonte e inicie novamente quando quiser.",
    connectionTitle: "A conexão foi interrompida",
    connectionBody: "Confira sua internet e tente novamente.",
    genericTitle: "Não foi possível iniciar o Jiddu Live",
    genericBody: "Tente novamente em alguns instantes.",
  },
  es: {
    creditsTitle: "Necesitas más créditos",
    creditsBody: (required?: number, available?: number) =>
      required !== undefined && available !== undefined
        ? `Jiddu Live necesita ${required} créditos para comenzar. Tienes ${available} disponibles.`
        : "Tu saldo actual no es suficiente para iniciar Jiddu Live.",
    buyCredits: "Comprar créditos",
    permissionTitle: "Permite el acceso al micrófono",
    permissionBody:
      "Autoriza a Jiddu a usar tu micrófono e inténtalo de nuevo.",
    microphoneTitle: "No encontramos un micrófono",
    microphoneBody: "Conecta o activa un micrófono e inténtalo de nuevo.",
    tabTitle: "El audio de la pestaña no está disponible",
    tabUnsupported:
      "Usa Chrome o Edge para transcribir el audio de otra pestaña.",
    tabAudioMissing:
      "Elige la pestaña de nuevo y activa la opción “Compartir audio”.",
    cancelledTitle: "Se canceló el uso compartido",
    cancelledBody: "Elige una fuente y vuelve a empezar cuando quieras.",
    connectionTitle: "Se interrumpió la conexión",
    connectionBody: "Comprueba tu conexión a internet e inténtalo de nuevo.",
    genericTitle: "No se pudo iniciar Jiddu Live",
    genericBody: "Inténtalo de nuevo en unos instantes.",
  },
} as const;

function LiveErrorNotice({
  error,
  hasAnalysisError,
  lang,
}: {
  error: LiveSessionError | null;
  hasAnalysisError: boolean;
  lang: "en" | "pt" | "es";
}) {
  const copy = LIVE_ERROR_COPY[lang];
  let title: string = copy.genericTitle;
  let body: string = copy.genericBody;
  let showCreditsAction = false;

  if (error?.code === "insufficient_jiddu_credits") {
    title = copy.creditsTitle;
    body = copy.creditsBody(error.required, error.available);
    showCreditsAction = true;
  } else if (error?.code === "microphone_permission") {
    title = copy.permissionTitle;
    body = copy.permissionBody;
  } else if (error?.code === "microphone_unavailable") {
    title = copy.microphoneTitle;
    body = copy.microphoneBody;
  } else if (error?.code === "tab_unsupported") {
    title = copy.tabTitle;
    body = copy.tabUnsupported;
  } else if (error?.code === "tab_audio_missing") {
    title = copy.tabTitle;
    body = copy.tabAudioMissing;
  } else if (error?.code === "capture_cancelled") {
    title = copy.cancelledTitle;
    body = copy.cancelledBody;
  } else if (error?.code === "connection_lost") {
    title = copy.connectionTitle;
    body = copy.connectionBody;
  } else if (hasAnalysisError) {
    title = copy.genericTitle;
    body = copy.genericBody;
  }

  return (
    <div className="mb-4 rounded-md border border-severity-high/50 bg-severity-high/10 px-4 py-3 text-sm">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-foreground/85">{body}</p>
      {showCreditsAction && (
        <Link
          href="/pricing"
          className="mt-3 inline-flex rounded-md bg-accent px-3 py-1.5 font-medium text-white transition-opacity hover:opacity-90"
        >
          {copy.buyCredits}
        </Link>
      )}
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
