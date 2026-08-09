"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import {
  ExternalLink,
  Languages,
  Loader2,
  Mic,
  MonitorSpeaker,
  Play,
  RotateCcw,
  Square,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ThinkingOrb } from "thinking-orbs";
import { AnalysisAuthModal } from "@/components/analysis-auth-modal";
import { LiveClaimsList } from "@/components/live/claims-list";
import { FindingsList } from "@/components/live/findings-list";
import { LiveNeutralityList } from "@/components/live/neutrality-list";
import { SourcePicker } from "@/components/live/source-picker";
import {
  SessionAudioToolsPanel,
  SessionDiarizationAction,
  useSessionAudioToolsController,
} from "@/components/live/session-audio-tools";
import {
  TranscriptStream,
  type TranscriptStreamHandle,
} from "@/components/live/transcript-stream";
import { useI18n } from "@/lib/i18n/provider";
import type { LiveDiarizationBillingConfig } from "@/lib/live-diarization-billing";
import { DEFAULT_LIVE_LENSES } from "@/lib/live-lenses";
import { useLiveAnalysis } from "@/lib/live/use-live-analysis";
import { useLiveClaimVerification } from "@/lib/live/use-live-claim-verification";
import { useLiveSession, type LiveSource } from "@/lib/live/use-live-session";
import { ContextGraph } from "./context-graph";
import { mutateContextEntity } from "./context-entity-mutations";
import { contextCopy } from "./context-copy";
import {
  ContextFloatingPanels,
  ContextPanelsControl,
  useContextFloatingPanels,
} from "./context-floating-panels";
import { ContextTopicsFeed } from "./context-topics-feed";
import { ContextNeutralityHeader } from "./context-neutrality-header";
import {
  contextThemeStyle,
  ContextThemeSelector,
  useContextTheme,
} from "./context-theme-control";
import { ContextSettingsButton, useContextSettings } from "./context-settings";
import { ContextUiStoreProvider } from "./context-ui-store-provider";
import { useContextEnrichment } from "./use-context-enrichment";
import { ContextActivityLog } from "./context-activity-log";
import {
  clearContextRecoveryMarker,
  ContextSessionStoreProvider,
  useContextRecoveryMarker,
  useContextSessionStore,
  useContextSessionStoreApi,
} from "./context-session-store-provider";
import { useContextSessionBridge } from "./use-context-session-bridge";

const MAX_SESSION_MS = 60 * 60 * 1_000;

type ContextWorkspaceProps = {
  diarizationBilling: LiveDiarizationBillingConfig;
  searchModels: { news: string; factCheck: string };
};

export function ContextWorkspace(props: ContextWorkspaceProps) {
  return (
    <ContextUiStoreProvider>
      <ContextSessionStoreProvider>
        <ContextWorkspaceContent {...props} />
      </ContextSessionStoreProvider>
    </ContextUiStoreProvider>
  );
}

function ContextWorkspaceContent({
  diarizationBilling,
  searchModels,
}: ContextWorkspaceProps) {
  const { lang, setLang } = useI18n();
  const copy = contextCopy(lang);
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const [source, setSource] = useState<LiveSource>("mic");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const transcriptRef = useRef<TranscriptStreamHandle>(null);
  const autoStopTriggeredRef = useRef(false);
  const floatingPanels = useContextFloatingPanels();
  const [contextTheme, setContextTheme] = useContextTheme();
  const contextSettings = useContextSettings();
  const sessionStore = useContextSessionStoreApi();

  const session = useLiveSession({ language: lang });
  const analysis = useLiveAnalysis({
    billingReservationId: session.billingReservationId,
    transcript: session.transcript,
    active: session.state === "live",
    language: lang,
    elapsedMs: session.elapsedMs,
    lenses: DEFAULT_LIVE_LENSES,
    intervalMs: contextSettings.settings.analysisIntervalMs,
  });
  const captureView = useContextSessionStore((state) => state.capture);
  const analysisView = useContextSessionStore((state) => state.analysis);
  const verification = useLiveClaimVerification(
    analysis.sessionId,
    analysisView.claims,
    session.elapsedMs,
  );
  const enrichment = useContextEnrichment({
    sessionId: analysis.sessionId,
    context: analysisView.context,
    language: lang,
    automaticNewsEnabled:
      session.state === "live" && contextSettings.settings.automaticNews,
  });
  useContextSessionBridge({
    source,
    session,
    analysis,
    verification,
    enrichment,
    analysisProcesses: DEFAULT_LIVE_LENSES.length,
    newsModel: searchModels.news,
    verificationModel: searchModels.factCheck,
  });
  const verificationView = useContextSessionStore(
    (state) => state.verification,
  );
  const enrichmentView = useContextSessionStore((state) => state.enrichment);
  const pipelineAgents = useContextSessionStore((state) => state.agents);
  const recoverableSessionId = useContextRecoveryMarker({
    sessionId: analysis.sessionId,
    state: session.state,
  });
  const diarization = useSessionAudioToolsController({
    audioBlob: session.localAudioBlob,
    audioUrl: session.localAudioUrl,
    billingConfig: diarizationBilling,
    downloadFilename: session.localAudioFilename,
    durationMs: session.elapsedMs,
    resourceId: analysis.sessionId,
    onIdentificationFinished: () => floatingPanels.selectPanel("transcript"),
  });

  const isRunning =
    session.state === "live" ||
    session.state === "connecting" ||
    session.state === "stopping";
  const concluded =
    (session.state === "stopped" || session.state === "error") &&
    analysis.sessionId != null;
  const controlsLocked = isRunning || verification.isVerifying;
  const jumpToSentence = useCallback((sentenceId: string) => {
    transcriptRef.current?.focusSentence(sentenceId);
  }, []);

  const handleRenameEntity = useCallback(
    async (entityId: string, name: string) => {
      if (!analysis.sessionId) throw new Error("Session is not ready");
      const operationId = createMutationOperationId();
      const mutation = {
        action: "rename",
        localEntityId: entityId,
        name,
        elapsedMs: session.elapsedMs,
      } as const;
      sessionStore.getState().beginEntityMutation(operationId, mutation);
      try {
        const result = await mutateContextEntity(analysis.sessionId, mutation);
        sessionStore
          .getState()
          .commitEntityMutation(operationId, result.context, result.claims);
        analysis.applyContextMutation(result.context, result.claims);
        if (result.verificationReset) verification.reset();
      } catch (error) {
        sessionStore.getState().rollbackEntityMutation(operationId);
        throw error;
      }
    },
    [analysis, session.elapsedMs, sessionStore, verification],
  );

  const handleMergeEntities = useCallback(
    async (sourceEntityId: string, targetEntityId: string) => {
      if (!analysis.sessionId) throw new Error("Session is not ready");
      const operationId = createMutationOperationId();
      const mutation = {
        action: "merge",
        sourceLocalEntityId: sourceEntityId,
        targetLocalEntityId: targetEntityId,
        elapsedMs: session.elapsedMs,
      } as const;
      sessionStore.getState().beginEntityMutation(operationId, mutation);
      try {
        const result = await mutateContextEntity(analysis.sessionId, mutation);
        sessionStore
          .getState()
          .commitEntityMutation(operationId, result.context, result.claims);
        analysis.applyContextMutation(result.context, result.claims);
        if (result.verificationReset) verification.reset();
      } catch (error) {
        sessionStore.getState().rollbackEntityMutation(operationId);
        throw error;
      }
    },
    [analysis, session.elapsedMs, sessionStore, verification],
  );

  const handleRemoveEntity = useCallback(
    async (entityId: string) => {
      if (!analysis.sessionId) throw new Error("Session is not ready");
      const operationId = createMutationOperationId();
      const mutation = {
        action: "remove",
        localEntityId: entityId,
        elapsedMs: session.elapsedMs,
      } as const;
      sessionStore.getState().beginEntityMutation(operationId, mutation);
      try {
        const result = await mutateContextEntity(analysis.sessionId, mutation);
        sessionStore
          .getState()
          .commitEntityMutation(operationId, result.context, result.claims);
        analysis.applyContextMutation(result.context, result.claims);
        if (result.verificationReset) verification.reset();
      } catch (error) {
        sessionStore.getState().rollbackEntityMutation(operationId);
        throw error;
      }
    },
    [analysis, session.elapsedMs, sessionStore, verification],
  );

  const handleStart = () => {
    if (authLoading || verification.isVerifying) return;
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    verification.reset();
    clearContextRecoveryMarker();
    sessionStore.getState().resetSession(source);
    void session.start(source);
  };

  const handleStop = useCallback(async () => {
    const audioDurationMs = await session.stop();
    const analysisId = await analysis.finalize(audioDurationMs);
    await session.finish(analysisId);
  }, [analysis, session]);

  useEffect(() => {
    const reachedLimit =
      session.state === "live" && session.elapsedMs >= MAX_SESSION_MS;
    if (!reachedLimit) {
      autoStopTriggeredRef.current = false;
      return;
    }
    if (autoStopTriggeredRef.current) return;
    autoStopTriggeredRef.current = true;
    void handleStop();
  }, [handleStop, session.elapsedMs, session.state]);

  const hasError = Boolean(session.error || analysis.error);
  const statusLabel =
    session.state === "live"
      ? copy.listening
      : session.state === "connecting"
        ? copy.connecting
        : analysis.isAnalyzing
          ? copy.analyzing
          : concluded
            ? copy.saved
            : copy.ready;

  return (
    <main
      style={contextThemeStyle(contextTheme)}
      data-theme={contextTheme}
      className={`context-orbs-theme grid h-dvh overflow-hidden bg-background text-foreground ${
        contextSettings.settings.showActivityLog
          ? "grid-rows-[auto_minmax(0,1fr)_auto]"
          : "grid-rows-[auto_minmax(0,1fr)]"
      }`}
    >
      <header
        data-context-controls
        className="relative z-50 bg-background/95 px-3 py-2 shadow-sm backdrop-blur sm:px-4"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div
            className="flex size-16 shrink-0 items-center justify-center"
            data-testid="context-session-mark"
          >
            {isRunning ? (
              <ThinkingOrb
                state="connecting"
                size={64}
                speed={1}
                theme={contextTheme}
                aria-label={statusLabel}
              />
            ) : (
              <Link
                href="/"
                aria-label={copy.exit}
                title={copy.exit}
                className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <Image
                  src={
                    contextTheme === "dark"
                      ? "/brand/jiddu_logo_inverted_128.webp"
                      : "/brand/jiddu_logo_128.webp"
                  }
                  alt="Jiddu"
                  width={64}
                  height={64}
                  priority
                  className={`size-16 object-cover ${contextTheme === "dark" ? "mix-blend-lighten" : "mix-blend-darken"}`}
                />
              </Link>
            )}
          </div>
          <div className="mr-auto flex min-w-0 flex-col justify-center leading-none">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d5533b] sm:text-xs">
              Jiddu
            </span>
            <div className="mt-0.5 flex items-baseline gap-2">
              <h1
                aria-label={copy.title}
                className="truncate font-serif text-2xl font-semibold leading-none sm:text-3xl"
              >
                Context
              </h1>
              <span className="rounded border border-accent/40 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-accent">
                beta
              </span>
            </div>
            <p className="mt-1 hidden truncate text-xs leading-normal text-muted xl:block">
              {copy.subtitle}
            </p>
          </div>

          <div className="hidden xl:block">
            <SourcePicker
              value={source}
              onChange={setSource}
              disabled={controlsLocked}
            />
          </div>
          <div className="xl:hidden">
            <CompactSourcePicker
              value={source}
              onChange={setSource}
              disabled={controlsLocked}
            />
          </div>
          <ContextThemeSelector
            theme={contextTheme}
            onChange={setContextTheme}
            copy={copy}
          />
          <label className="inline-flex items-center gap-1 rounded-md border border-rule bg-paper px-2 py-1.5 text-xs text-muted">
            <Languages className="size-3.5" />
            <select
              aria-label="Language"
              className="bg-transparent text-foreground outline-none"
              value={lang}
              disabled={isRunning}
              onChange={(event) => setLang(event.target.value as typeof lang)}
            >
              <option value="en">EN</option>
              <option value="pt">PT</option>
              <option value="es">ES</option>
            </select>
          </label>
          {!isRunning ? (
            <button
              type="button"
              onClick={handleStart}
              disabled={authLoading || verification.isVerifying}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-60"
            >
              {concluded ? (
                <RotateCcw className="size-3.5" />
              ) : (
                <Play className="size-3.5" />
              )}
              <span className="hidden sm:inline">
                {concluded ? copy.newSession : copy.start}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleStop()}
              disabled={session.state === "stopping"}
              className="inline-flex items-center gap-1.5 rounded-md bg-severity-high px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {session.state === "stopping" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Square className="size-3.5" />
              )}
              <span className="hidden sm:inline">{copy.stop}</span>
            </button>
          )}
          <div className="inline-flex items-center gap-1.5 text-xs text-muted">
            <span
              className={`size-2 rounded-full ${session.state === "live" ? "animate-pulse bg-emerald-500" : analysis.isAnalyzing ? "animate-pulse bg-amber-500" : "bg-muted"}`}
            />
            <span>{statusLabel}</span>
            {isRunning ? (
              <span className="tabular-nums">
                {formatDuration(session.elapsedMs)}
              </span>
            ) : null}
          </div>
          <ContextPanelsControl
            state={floatingPanels}
            labels={{
              transcript: copy.transcript,
              fallacies: copy.fallacies,
              facts: copy.facts,
              topics: copy.tagsAndTopics,
              neutrality: copy.neutrality,
            }}
            copy={copy}
          />
          {concluded && analysis.sessionId ? (
            <Link
              href={`/context/${analysis.sessionId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background shadow-lg transition-opacity hover:opacity-85"
            >
              {copy.openSaved}
              <ExternalLink className="size-3" />
            </Link>
          ) : recoverableSessionId && !analysis.sessionId && !isRunning ? (
            <Link
              href={`/context/${recoverableSessionId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
            >
              {copy.recoverSession}
              <ExternalLink className="size-3" />
            </Link>
          ) : null}
          {diarization.available ? (
            <SessionDiarizationAction
              controller={diarization}
              variant="header"
            />
          ) : null}
          <ContextNeutralityHeader
            verdict={analysisView.neutralityVerdict}
            findings={analysisView.neutralityFindings}
            final={concluded}
            copy={copy}
          />
          <div className="shrink-0">
            <ContextSettingsButton
              control={contextSettings}
              copy={copy}
              showCaptureSettings
              captureSettingsLocked={controlsLocked}
            />
          </div>
        </div>

        {hasError ? (
          <p className="absolute inset-x-3 top-full z-30 mt-1 rounded-md border border-red-500/40 bg-background px-3 py-2 text-xs text-red-400 shadow-lg">
            {copy.captureError} {analysis.error ?? session.error?.code ?? ""}
          </p>
        ) : null}
      </header>

      <section className="relative min-h-0">
        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-md border border-rule bg-background/85 px-2.5 py-1.5 text-xs backdrop-blur">
          <span className="font-medium">{copy.graph}</span>
          <span className="ml-2 text-muted">
            {analysisView.context.entities.length} {copy.entities} ·{" "}
            {analysisView.context.relations.length} {copy.relations}
          </span>
        </div>
        {enrichmentView.errors.size > 0 ? (
          <p className="pointer-events-none absolute right-3 top-3 z-10 max-w-xs rounded-md border border-amber-500/30 bg-background/85 px-2.5 py-1.5 text-[10px] text-amber-400 backdrop-blur">
            {copy.newsUnavailable}
          </p>
        ) : null}
        <ContextGraph
          context={analysisView.context}
          enrichedEntities={enrichmentView.entities}
          enrichedRelations={enrichmentView.relations}
          copy={copy}
          onJumpToSentence={jumpToSentence}
          editable={Boolean(analysis.sessionId) && !verification.isVerifying}
          onRenameEntity={handleRenameEntity}
          onMergeEntities={handleMergeEntities}
          onRemoveEntity={handleRemoveEntity}
          colorMode={contextTheme}
          showMiniMap={contextSettings.settings.showMiniMap}
          animateRelations={contextSettings.settings.animateRelations}
        />
        <ContextFloatingPanels
          state={floatingPanels}
          copy={copy}
          panels={{
            transcript: {
              title: copy.transcript,
              toneClass: "bg-violet-500",
              contentClassName: "overflow-hidden",
              content: (
                <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]">
                  <TranscriptStream
                    ref={transcriptRef}
                    transcript={captureView.transcript}
                    active={session.state === "live"}
                    variant="feed"
                  />
                  {diarization.available ? (
                    <SessionAudioToolsPanel
                      controller={diarization}
                      compact
                    />
                  ) : null}
                </div>
              ),
            },
            fallacies: {
              title: copy.fallacies,
              count: analysisView.findings.length,
              toneClass: "bg-rose-500",
              content: (
                <FindingsList findings={analysisView.findings} lang={lang} />
              ),
            },
            facts: {
              title: copy.facts,
              count: analysisView.claims.length,
              toneClass: "bg-blue-500",
              content: (
                <>
                  <p className="mb-2 rounded-md border border-blue-500/20 bg-blue-500/5 p-2 text-[10px] leading-snug text-muted">
                    {copy.detectedHint}
                  </p>
                  <LiveClaimsList
                    claims={analysisView.claims}
                    verdicts={verificationView.verdicts}
                    maxSources={contextSettings.settings.factSourceLimit}
                    sourcesInitiallyOpen={
                      contextSettings.settings.expandFactSources
                    }
                    verificationActions={
                      analysis.sessionId
                        ? {
                            onVerify: (claimId) =>
                              void verification.startClaim(claimId),
                            verifyingClaimIds:
                              verificationView.verifyingClaimIds,
                            errors: verificationView.claimErrors,
                            verifyLabel: copy.verifyOne,
                            reverifyLabel: copy.reverifyOne,
                            verifyingLabel: copy.verifying,
                          }
                        : undefined
                    }
                  />
                </>
              ),
            },
            topics: {
              title: copy.tagsAndTopics,
              count: analysisView.context.tags?.length ?? 0,
              toneClass: "bg-emerald-500",
              content: (
                <ContextTopicsFeed context={analysisView.context} copy={copy} />
              ),
            },
            neutrality: {
              title: copy.neutrality,
              count: analysisView.neutralityFindings.length,
              toneClass: "bg-amber-500",
              content: (
                <LiveNeutralityList
                  findings={analysisView.neutralityFindings}
                  verdict={analysisView.neutralityVerdict}
                  verdictLabel={
                    concluded ? copy.finalAssessment : copy.currentAssessment
                  }
                />
              ),
            },
          }}
        />
      </section>

      {contextSettings.settings.showActivityLog ? (
        <ContextActivityLog
          copy={copy}
          agents={pipelineAgents}
        />
      ) : null}

      <AnalysisAuthModal
        open={authModalOpen}
        returnTo={pathname}
        onClose={() => setAuthModalOpen(false)}
      />
    </main>
  );
}

function CompactSourcePicker({
  value,
  onChange,
  disabled,
}: {
  value: LiveSource;
  onChange: (source: LiveSource) => void;
  disabled: boolean;
}) {
  const Icon = value === "mic" ? Mic : MonitorSpeaker;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(value === "mic" ? "tab" : "mic")}
      className="grid h-8 w-10 place-items-center rounded-md border border-rule bg-paper text-muted disabled:opacity-50"
      aria-label={value}
    >
      <Icon className="size-4" />
    </button>
  );
}

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function createMutationOperationId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
