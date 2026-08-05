"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  Loader2,
  Play,
  RotateCcw,
  Square,
} from "lucide-react";
import { AnalysisAuthModal } from "@/components/analysis-auth-modal";
import { useLiveSession, type LiveSource } from "@/lib/live/use-live-session";
import type { LiveSessionError } from "@/lib/live/use-live-session";
import { useLiveAnalysis } from "@/lib/live/use-live-analysis";
import { useLiveClaimVerification } from "@/lib/live/use-live-claim-verification";
import { useI18n } from "@/lib/i18n/provider";
import type { Messages } from "@/lib/i18n/messages";
import { splitSentences } from "@/lib/sentences";
import { EMPTY_LIVE_CONTEXT } from "@/lib/live-context-schema";
import {
  DEFAULT_LIVE_LENSES,
  type LiveLens,
} from "@/lib/live-lenses";
import { SourcePicker } from "./source-picker";
import {
  TranscriptStream,
  type TranscriptStreamHandle,
} from "./transcript-stream";
import { FindingsList } from "./findings-list";
import { LiveLensPicker } from "./lens-picker";
import { LiveAnalysisIntervalPicker } from "./analysis-interval-picker";
import { LiveClaimsList } from "./claims-list";
import { LiveNeutralityList } from "./neutrality-list";
import { LiveAllResults } from "./all-results";
import { LiveClaimVerificationPanel } from "./claim-verification-panel";
import { LiveContextPanel } from "./context-panel";

// Hard cap: stop the session after this many seconds to prevent runaway cost.
// 60 minutes ≈ $1 of gpt-live-transcribe at $0.017/min, before LLM analysis.
const MAX_SESSION_MS = 60 * 60 * 1000;
type LiveResultTab = "all" | LiveLens;

export function LivePage() {
  // Use the site-wide language preference (selector lives in the header) so
  // both the transcription hint and the LLM analysis output language
  // follow the rest of the UI.
  const { lang, t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const [source, setSource] = useState<LiveSource>("mic");
  const [lenses, setLenses] = useState<LiveLens[]>(DEFAULT_LIVE_LENSES);
  const [sessionLenses, setSessionLenses] = useState<LiveLens[]>(
    DEFAULT_LIVE_LENSES,
  );
  const [activeLens, setActiveLens] = useState<LiveResultTab>("all");
  const [analysisIntervalMs, setAnalysisIntervalMs] = useState(30_000);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const transcriptStreamRef = useRef<TranscriptStreamHandle>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  const session = useLiveSession({ language: lang });
  const analysis = useLiveAnalysis({
    billingReservationId: session.billingReservationId,
    transcript: session.transcript,
    active: session.state === "live",
    language: lang,
    lenses: sessionLenses,
    intervalMs: analysisIntervalMs,
  });
  const claimVerification = useLiveClaimVerification(
    analysis.sessionId,
    analysis.claims,
  );

  const isRunning =
    session.state === "live" ||
    session.state === "connecting" ||
    session.state === "stopping";
  const verificationRunning = claimVerification.status === "running";
  const controlsLocked = isRunning || verificationRunning;
  const resultLenses =
    session.state === "idle" && !analysis.sessionId ? lenses : sessionLenses;
  const reachedHardLimit =
    session.state === "live" && session.elapsedMs >= MAX_SESSION_MS;
  const autoStopTriggeredRef = useRef(false);
  // A session is "concluded" when we've stopped recording AND the LLM
  // finalized; the user can then view the persisted analysis or start over.
  const hasConcludedSession =
    (session.state === "stopped" || session.state === "error") &&
    analysis.sessionId != null;
  const visibleLensErrors =
    activeLens === "all"
      ? resultLenses.flatMap((lens) => {
          const error = analysis.lensErrors[lens];
          return error ? [{ lens, error }] : [];
        })
      : analysis.lensErrors[activeLens]
        ? [{ lens: activeLens, error: analysis.lensErrors[activeLens]! }]
        : [];
  const canVerifyClaimsHere =
    hasConcludedSession &&
    sessionLenses.includes("factcheck") &&
    analysis.claims.length > 0 &&
    (activeLens === "all" || activeLens === "factcheck");
  const handleJumpToSentence = useCallback(
    (sentenceId: string) => {
      transcriptStreamRef.current?.focusSentence(sentenceId);
      const sentence = splitSentences(session.transcript).find(
        (candidate) => candidate.id === sentenceId,
      );
      const player = audioPlayerRef.current;
      if (!sentence || !player || session.transcript.length === 0) return;
      player.currentTime =
        (sentence.start / session.transcript.length) *
        (session.elapsedMs / 1000);
      void player.play().catch(() => {
        // Some browsers can still decline playback despite the user click.
      });
    },
    [session.elapsedMs, session.transcript],
  );

  const handleStart = () => {
    if (authLoading || verificationRunning) return;
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    claimVerification.reset();
    setSessionLenses(lenses);
    if (activeLens !== "all" && !lenses.includes(activeLens)) {
      setActiveLens("all");
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
    setActiveLens("all");
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
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12 flex-1 w-full">
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
        <SourcePicker
          value={source}
          onChange={setSource}
          disabled={controlsLocked}
        />
        <span className="text-xs text-muted">
          {t.live_language_follows_header}
        </span>
      </div>

      <LiveLensPicker
        disabled={controlsLocked}
        value={lenses}
        onChange={(next) => {
          setLenses(next);
          if (activeLens !== "all" && !next.includes(activeLens)) {
            setActiveLens("all");
          }
        }}
      />

      <LiveAnalysisIntervalPicker
        disabled={controlsLocked}
        value={analysisIntervalMs}
        onChange={setAnalysisIntervalMs}
      />

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {!isRunning ? (
          <button
            type="button"
            onClick={handleStart}
            disabled={authLoading || verificationRunning}
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
        <div className="mb-4 rounded-md border border-accent/40 bg-accent/10 px-3 py-3 text-sm text-foreground">
          <span>{t.live_session_saved}</span>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            {sessionLenses.includes("fallacy") ? (
              <ResultLink
                href={`/a/${analysis.sessionId}`}
                label={t.live_view_analysis}
              />
            ) : null}
            {sessionLenses.includes("factcheck") ? (
              <ResultLink
                href={`/f/${analysis.sessionId}`}
                label={t.live_view_factcheck}
              />
            ) : null}
            {sessionLenses.includes("neutrality") ? (
              <ResultLink
                href={`/n/${analysis.sessionId}`}
                label={t.live_view_neutrality}
              />
            ) : null}
            {sessionLenses.includes("context") &&
            liveLensCount("context", analysis) > 0 ? (
              <ResultLink
                href={`/live/${analysis.sessionId}`}
                label={t.live_view_context}
              />
            ) : null}
          </div>
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
        ref={transcriptStreamRef}
        transcript={session.transcript}
        active={session.state === "live"}
      />

      {hasConcludedSession && session.localAudioUrl ? (
        <div className="mt-3 rounded-md border border-rule bg-paper px-3 py-3">
          <div className="mb-2">
            <p className="text-sm font-medium">{t.live_local_recording}</p>
            <p className="mt-0.5 text-xs text-muted">
              {t.live_local_recording_hint}
            </p>
          </div>
          <audio
            ref={audioPlayerRef}
            controls
            preload="metadata"
            src={session.localAudioUrl}
            className="h-10 w-full"
          />
        </div>
      ) : null}

      <section className="mt-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-rule pb-3">
          <button
            type="button"
            aria-pressed={activeLens === "all"}
            onClick={() => setActiveLens("all")}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              activeLens === "all"
                ? "border-accent bg-accent text-white"
                : "border-rule text-muted hover:text-foreground"
            }`}
          >
            {t.live_all} ({liveAllCount(analysis, resultLenses)})
          </button>
          {resultLenses.map((lens) => (
            <button
              key={lens}
              type="button"
              aria-pressed={activeLens === lens}
              onClick={() => setActiveLens(lens)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                activeLens === lens
                  ? "border-accent bg-accent text-white"
                  : "border-rule text-muted hover:text-foreground"
              }`}
            >
              {liveLensLabel(lens, t)} ({liveLensCount(lens, analysis)})
            </button>
          ))}
          {activeLens === "fallacy" && analysis.score != null && (
            <span className="text-sm text-muted">
              {t.live_running_score}:{" "}
              <strong className="text-foreground">{analysis.score}</strong>
              /100
            </span>
          )}
        </div>

        {visibleLensErrors.map(({ lens, error }) => (
          <p
            key={lens}
            className="mb-3 rounded-md border border-severity-high/40 bg-severity-high/10 px-3 py-2 text-sm text-severity-high"
          >
            <strong>{liveLensLabel(lens, t)}:</strong> {error}
          </p>
        ))}

        {canVerifyClaimsHere ? (
          <LiveClaimVerificationPanel
            status={claimVerification.status}
            progress={claimVerification.progress}
            error={claimVerification.error}
            start={claimVerification.start}
          />
        ) : null}

        {activeLens === "all" ? (
          <LiveAllResults
            findings={
              resultLenses.includes("fallacy") ? analysis.findings : []
            }
            claims={resultLenses.includes("factcheck") ? analysis.claims : []}
            neutralityFindings={
              resultLenses.includes("neutrality")
                ? analysis.neutralityFindings
                : []
            }
            neutralityVerdict={
              resultLenses.includes("neutrality")
                ? analysis.neutralityVerdict
                : null
            }
            context={
              resultLenses.includes("context")
                ? analysis.context
                : EMPTY_LIVE_CONTEXT
            }
            verdicts={claimVerification.verdicts}
            verifyingClaims={claimVerification.status === "running"}
            lang={lang}
            active={session.state === "live"}
            concluded={hasConcludedSession}
            onJumpToSentence={handleJumpToSentence}
          />
        ) : activeLens === "context" ? (
          <LiveContextPanel
            context={analysis.context}
            active={session.state === "live"}
            concluded={hasConcludedSession}
            onJumpToSentence={handleJumpToSentence}
          />
        ) : activeLens === "fallacy" ? (
          <FindingsList findings={analysis.findings} lang={lang} />
        ) : activeLens === "factcheck" ? (
          <LiveClaimsList
            claims={analysis.claims}
            verdicts={claimVerification.verdicts}
            verifying={claimVerification.status === "running"}
          />
        ) : (
          <LiveNeutralityList
            findings={analysis.neutralityFindings}
            verdict={analysis.neutralityVerdict}
          />
        )}
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

function ResultLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 font-medium text-accent hover:underline"
    >
      {label}
      <ExternalLink aria-hidden="true" className="size-3.5" />
    </Link>
  );
}

function liveLensLabel(lens: LiveLens, t: Messages): string {
  if (lens === "context") return t.live_lens_context;
  if (lens === "factcheck") return t.live_lens_factcheck;
  if (lens === "neutrality") return t.live_lens_neutrality;
  return t.live_lens_fallacy;
}

function liveLensCount(
  lens: LiveLens,
  analysis: ReturnType<typeof useLiveAnalysis>,
): number {
  if (lens === "context") {
    return (
      (analysis.context.tags?.length ?? 0) +
      (analysis.context.relatedLinks?.length ?? 0) +
      analysis.context.topics.length +
      analysis.context.terms.length +
      analysis.context.segments.length
    );
  }
  if (lens === "factcheck") return analysis.claims.length;
  if (lens === "neutrality") {
    return (
      analysis.neutralityFindings.length +
      (analysis.neutralityVerdict ? 1 : 0)
    );
  }
  return analysis.findings.length;
}

function liveAllCount(
  analysis: ReturnType<typeof useLiveAnalysis>,
  lenses: readonly LiveLens[],
): number {
  return (
    (lenses.includes("fallacy") ? analysis.findings.length : 0) +
    (lenses.includes("factcheck") ? analysis.claims.length : 0) +
    (lenses.includes("neutrality")
      ? analysis.neutralityFindings.length +
        (analysis.neutralityVerdict ? 1 : 0)
      : 0) +
    (lenses.includes("context")
      ? (analysis.context.tags?.length ?? 0) +
        (analysis.context.relatedLinks?.length ?? 0) +
        analysis.context.topics.length +
        analysis.context.terms.length +
        analysis.context.segments.length
      : 0)
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
    rateLimitTitle: "Live start limit reached",
    rateLimitBody: (retryAfterSeconds?: number) =>
      retryAfterSeconds
        ? `Too many Live sessions were started in a short period. Try again in about ${formatRetryDelay(retryAfterSeconds, "en")}.`
        : "Too many Live sessions were started in a short period. Please wait a moment and try again.",
    connectionTitle: "The connection was interrupted",
    connectionBody: "Check your internet connection and try again.",
    analysisTitle: "The conversation couldn’t be analyzed",
    analysisBody:
      "The capture finished, but the results couldn’t be processed. Please try again.",
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
    rateLimitTitle: "Limite de inicializações do Live atingido",
    rateLimitBody: (retryAfterSeconds?: number) =>
      retryAfterSeconds
        ? `Muitas sessões do Live foram iniciadas em pouco tempo. Tente novamente em cerca de ${formatRetryDelay(retryAfterSeconds, "pt")}.`
        : "Muitas sessões do Live foram iniciadas em pouco tempo. Aguarde um momento e tente novamente.",
    connectionTitle: "A conexão foi interrompida",
    connectionBody: "Confira sua internet e tente novamente.",
    analysisTitle: "Não foi possível analisar a conversa",
    analysisBody:
      "A captura foi concluída, mas os resultados não puderam ser processados. Tente novamente.",
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
    rateLimitTitle: "Se alcanzó el límite de inicios de Live",
    rateLimitBody: (retryAfterSeconds?: number) =>
      retryAfterSeconds
        ? `Se iniciaron demasiadas sesiones de Live en poco tiempo. Inténtalo de nuevo en aproximadamente ${formatRetryDelay(retryAfterSeconds, "es")}.`
        : "Se iniciaron demasiadas sesiones de Live en poco tiempo. Espera un momento e inténtalo de nuevo.",
    connectionTitle: "Se interrumpió la conexión",
    connectionBody: "Comprueba tu conexión a internet e inténtalo de nuevo.",
    analysisTitle: "No se pudo analizar la conversación",
    analysisBody:
      "La captura finalizó, pero los resultados no pudieron procesarse. Inténtalo de nuevo.",
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
  } else if (error?.code === "rate_limited") {
    title = copy.rateLimitTitle;
    body = copy.rateLimitBody(error.retryAfterSeconds);
  } else if (error?.code === "connection_lost") {
    title = copy.connectionTitle;
    body = copy.connectionBody;
  } else if (hasAnalysisError) {
    title = copy.analysisTitle;
    body = copy.analysisBody;
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

function formatRetryDelay(
  retryAfterSeconds: number,
  lang: "en" | "pt" | "es",
): string {
  if (retryAfterSeconds < 60) {
    const seconds = Math.max(1, Math.ceil(retryAfterSeconds));
    if (lang === "pt") return `${seconds} segundo${seconds === 1 ? "" : "s"}`;
    if (lang === "es") return `${seconds} segundo${seconds === 1 ? "" : "s"}`;
    return `${seconds} second${seconds === 1 ? "" : "s"}`;
  }

  const minutes = Math.ceil(retryAfterSeconds / 60);
  if (lang === "pt") return `${minutes} minuto${minutes === 1 ? "" : "s"}`;
  if (lang === "es") return `${minutes} minuto${minutes === 1 ? "" : "s"}`;
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
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
