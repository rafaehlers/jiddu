"use client";

import { ArrowLeft, Languages, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { LiveClaimsList } from "@/components/live/claims-list";
import { FindingsList } from "@/components/live/findings-list";
import { LiveNeutralityList } from "@/components/live/neutrality-list";
import {
  SavedDiarizedTranscript,
  type SavedDiarizedTranscriptHandle,
} from "@/components/live/saved-diarized-transcript";
import {
  TranscriptStream,
  type TranscriptStreamHandle,
} from "@/components/live/transcript-stream";
import type {
  KnowledgeEntityDTO,
  KnowledgeRelationDTO,
} from "@/lib/context-knowledge-schema";
import {
  buildContextReplayFrame,
  resolveContextReplayDuration,
  type ContextReplaySource,
} from "@/lib/context-replay";
import type { ContextReplayEvent } from "@/lib/context-replay-schema";
import type { Lang } from "@/lib/fallacies";
import { useI18n } from "@/lib/i18n/provider";
import type { LiveContext } from "@/lib/live-context-schema";
import {
  groupDiarizedSegments,
  type SavedDiarization,
} from "@/lib/live/diarization";
import { resolveDiarizedTurnTimeForSentence } from "@/lib/live/diarized-transcript-navigation";
import type {
  LiveClaim,
  LiveNeutralityVerdict,
} from "@/lib/live/use-live-analysis";
import { useLiveClaimVerification } from "@/lib/live/use-live-claim-verification";
import type { NeutralityFinding } from "@/lib/neutrality-schema";
import type { Finding, Sentence } from "@/lib/schema";
import type { Verdict } from "@/lib/verdict-schema";
import { ContextGraph } from "./context-graph";
import {
  mutateContextEntity,
  type ContextEntityMutation,
} from "./context-entity-mutations";
import { contextCopy } from "./context-copy";
import {
  ContextDockview,
  ContextPanelsControl,
  useContextDockview,
} from "./context-dockview";
import { ContextTopicsFeed } from "./context-topics-feed";
import { ContextNeutralityHeader } from "./context-neutrality-header";
import {
  ContextReplayTimeline,
  useContextReplayTimeline,
} from "./context-replay-timeline";
import {
  ContextSettingsButton,
  useContextSettings,
} from "./context-settings";
import {
  contextThemeStyle,
  ContextThemeSelector,
  useContextTheme,
} from "./context-theme-control";
import { ContextUiStoreProvider } from "./context-ui-store-provider";
import {
  ContextAnalysisSetupButton,
  ContextAnalysisSetupDialog,
} from "./context-analysis-setup";
import { updateContextAnalysisConfiguration } from "./context-analysis-configuration";
import {
  ContextClaimRecoveryAction,
  hasCompletedClaimRecovery,
} from "./context-claim-recovery";
import { ContextSessionTitleEditor } from "./context-session-title-editor";

type Props = {
  id: string;
  canManage: boolean;
  title: string;
  transcript: string;
  diarization: SavedDiarization | null;
  sentences: Sentence[];
  audioDurationMs: number | null;
  replayEvents: ContextReplayEvent[];
  context: LiveContext;
  findings: Finding[];
  claims: LiveClaim[];
  verdicts: Verdict[];
  neutralityFindings: NeutralityFinding[];
  neutralityVerdict: LiveNeutralityVerdict | null;
  enrichedEntities: ReadonlyArray<readonly [string, KnowledgeEntityDTO]>;
  enrichedRelations: ReadonlyArray<readonly [string, KnowledgeRelationDTO]>;
};

export function ContextReviewWorkspace(props: Props) {
  return (
    <ContextUiStoreProvider>
      <ContextReviewWorkspaceContent {...props} />
    </ContextUiStoreProvider>
  );
}

function ContextReviewWorkspaceContent({
  id,
  canManage,
  title,
  transcript,
  diarization,
  sentences,
  audioDurationMs,
  replayEvents,
  context,
  findings,
  claims,
  verdicts,
  neutralityFindings,
  neutralityVerdict,
  enrichedEntities,
  enrichedRelations,
}: Props) {
  const { lang, setLang, t } = useI18n();
  const copy = contextCopy(lang);
  const transcriptRef = useRef<TranscriptStreamHandle>(null);
  const diarizedTranscriptRef =
    useRef<SavedDiarizedTranscriptHandle>(null);
  const dockview = useContextDockview();
  const [contextTheme, setContextTheme] = useContextTheme();
  const contextSettings = useContextSettings();
  const [transcriptView, setTranscriptView] = useState<
    "replay" | "speakers"
  >(diarization ? "speakers" : "replay");
  const [currentContext, setCurrentContext] = useState(context);
  const [currentFindings, setCurrentFindings] = useState(findings);
  const [currentClaims, setCurrentClaims] = useState(claims);
  const [currentNeutralityFindings, setCurrentNeutralityFindings] =
    useState(neutralityFindings);
  const [analysisSetupOpen, setAnalysisSetupOpen] = useState(false);
  const [currentVerdicts, setCurrentVerdicts] = useState(verdicts);
  const claimRecoveryInitiallyComplete = useMemo(
    () => hasCompletedClaimRecovery(replayEvents),
    [replayEvents],
  );
  const [entityMap, setEntityMap] = useState(
    () => new Map<string, KnowledgeEntityDTO>(enrichedEntities),
  );
  const [relationMap, setRelationMap] = useState(
    () => new Map<string, KnowledgeRelationDTO>(enrichedRelations),
  );
  const verification = useLiveClaimVerification(id, currentClaims);
  const finalVerdicts = useMemo(() => {
    const result = new Map<string, Verdict>(
      currentVerdicts.map((verdict) => [verdict.claimId, verdict]),
    );
    for (const [claimId, verdict] of verification.verdicts) {
      result.set(claimId, verdict);
    }
    return [...result.values()];
  }, [currentVerdicts, verification.verdicts]);
  const replaySource = useMemo<ContextReplaySource>(
    () => ({
      transcript,
      sentences,
      audioDurationMs,
      context: currentContext,
      findings: currentFindings,
      claims: currentClaims,
      verdicts: finalVerdicts,
      neutralityFindings: currentNeutralityFindings,
      neutralityVerdict,
      events: replayEvents,
    }),
    [
      audioDurationMs,
      currentClaims,
      currentContext,
      finalVerdicts,
      currentFindings,
      currentNeutralityFindings,
      neutralityVerdict,
      replayEvents,
      sentences,
      transcript,
    ],
  );
  const replayDurationMs = useMemo(
    () => resolveContextReplayDuration(replaySource),
    [replaySource],
  );
  const timeline = useContextReplayTimeline(replayDurationMs);
  const frame = useMemo(
    () => buildContextReplayFrame(replaySource, timeline.playheadMs),
    [replaySource, timeline.playheadMs],
  );
  const verdictMap = useMemo(
    () => new Map(frame.verdicts.map((verdict) => [verdict.claimId, verdict])),
    [frame.verdicts],
  );
  const diarizedTurns = useMemo(
    () =>
      diarization ? groupDiarizedSegments(diarization.result.segments) : [],
    [diarization],
  );
  const selectDockviewPanel = dockview.selectPanel;
  const jumpToSentence = useCallback(
    (sentenceId: string) => {
      selectDockviewPanel("transcript");
      if (diarization) {
        const focusTime = resolveDiarizedTurnTimeForSentence({
          sentenceId,
          transcript,
          durationMs: replayDurationMs,
          events: replayEvents,
          turns: diarizedTurns,
        });
        setTranscriptView("speakers");
        if (focusTime !== null) {
          window.requestAnimationFrame(() => {
            diarizedTranscriptRef.current?.focusTime(focusTime);
          });
        }
        return;
      }

      setTranscriptView("replay");
      window.requestAnimationFrame(() => {
        transcriptRef.current?.focusSentence(sentenceId);
      });
    },
    [
      diarization,
      diarizedTurns,
      replayDurationMs,
      replayEvents,
      selectDockviewPanel,
      transcript,
    ],
  );
  const replayTimeline = {
    ...timeline,
    toggle: () => {
      setTranscriptView("replay");
      timeline.toggle();
    },
    restart: () => {
      setTranscriptView("replay");
      timeline.restart();
    },
    seek: (value: number) => {
      setTranscriptView("replay");
      timeline.seek(value);
    },
  };

  const applyMutation = useCallback(
    async (mutation: ContextEntityMutation) => {
      timeline.showFinal();
      const result = await mutateContextEntity(id, mutation);
      setCurrentContext(result.context);
      setCurrentClaims(result.claims);
      setCurrentFindings(result.findings);
      setCurrentNeutralityFindings(result.neutralityFindings);
      if (result.verificationReset) setCurrentVerdicts([]);
      setRelationMap(new Map());
      if (result.verificationReset) verification.reset();
      const affectedEntityId =
        mutation.action === "rename" || mutation.action === "remove"
          ? mutation.localEntityId
          : mutation.targetLocalEntityId;
      setEntityMap((current) => {
        const next = new Map(current);
        if (mutation.action === "merge") {
          next.delete(mutation.sourceLocalEntityId);
        }
        next.delete(affectedEntityId);
        return next;
      });
      const affectedEntity = result.context.entities.find(
        (entity) => entity.id === affectedEntityId,
      );
      if (affectedEntity) {
        void refreshProfile(id, lang, affectedEntity, (profile) => {
          setEntityMap((current) => {
            const next = new Map(current);
            next.set(affectedEntityId, profile);
            return next;
          });
        });
      }
    },
    [id, lang, timeline, verification],
  );

  const handleRenameEntity = useCallback(
    (entityId: string, name: string) =>
      applyMutation({ action: "rename", localEntityId: entityId, name }),
    [applyMutation],
  );
  const handleMergeEntities = useCallback(
    (sourceEntityId: string, targetEntityId: string) =>
      applyMutation({
        action: "merge",
        sourceLocalEntityId: sourceEntityId,
        targetLocalEntityId: targetEntityId,
      }),
    [applyMutation],
  );
  const handleRemoveEntity = useCallback(
    (entityId: string) =>
      applyMutation({ action: "remove", localEntityId: entityId }),
    [applyMutation],
  );

  const saveAnalysisConfiguration = useCallback(
    async (nextConfig: LiveContext["analysisConfig"]) => {
      const result = await updateContextAnalysisConfiguration({
        sessionId: id,
        config: nextConfig,
        lang,
        elapsedMs: audioDurationMs ?? undefined,
      });
      setCurrentContext(result.context);
      setCurrentFindings(result.findings);
      setCurrentClaims(result.claims);
      setCurrentNeutralityFindings(result.neutralityFindings);
      if (result.verificationReset) {
        setCurrentVerdicts([]);
        verification.reset();
      }
      timeline.showFinal();
      setAnalysisSetupOpen(false);
    },
    [audioDurationMs, id, lang, timeline, verification],
  );

  return (
    <main
      style={contextThemeStyle(contextTheme)}
      data-theme={contextTheme}
      className="context-orbs-theme grid h-dvh grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden bg-background text-foreground"
    >
      <header
        data-context-controls
        className="relative z-50 bg-background py-2 pl-3 pr-14 sm:pl-4 sm:pr-16"
      >
        <div className="flex items-center gap-3">
          <Link
            href="/context"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted hover:bg-paper hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">{copy.newSession}</span>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-baseline gap-2">
              {canManage ? (
                <ContextSessionTitleEditor
                  sessionId={id}
                  title={title}
                  labels={{
                    edit: copy.editSessionTitle,
                    input: copy.sessionTitleLabel,
                    save: copy.saveSessionTitle,
                    cancel: copy.cancelSessionTitleEdit,
                    error: copy.sessionTitleSaveError,
                  }}
                />
              ) : (
                <h1 className="min-w-0 flex-1 truncate font-serif text-lg font-semibold sm:text-xl">
                  {title}
                </h1>
              )}
              <span className="shrink-0 rounded border border-accent/40 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-accent">
                {copy.saved}
              </span>
            </div>
            <p className="truncate text-xs text-muted">{copy.subtitle}</p>
          </div>
          <ContextThemeSelector
            theme={contextTheme}
            onChange={setContextTheme}
            copy={copy}
          />
          {canManage ? (
            <ContextAnalysisSetupButton
              config={currentContext.analysisConfig}
              lang={lang}
              onClick={() => setAnalysisSetupOpen(true)}
            />
          ) : null}
          <label className="inline-flex items-center gap-1 rounded-md border border-rule bg-paper px-2 py-1.5 text-xs text-muted">
            <Languages className="size-3.5" />
            <select
              aria-label="Language"
              className="bg-transparent text-foreground outline-none"
              value={lang}
              onChange={(event) => setLang(event.target.value as Lang)}
            >
              <option value="en">EN</option>
              <option value="pt">PT</option>
              <option value="es">ES</option>
            </select>
          </label>
          <ContextPanelsControl
            state={dockview}
            labels={{
              transcript: copy.transcript,
              fallacies: copy.fallacies,
              facts: copy.facts,
              topics: copy.tagsAndTopics,
              neutrality: copy.neutrality,
            }}
            copy={copy}
          />
          <ContextNeutralityHeader
            verdict={frame.neutralityVerdict}
            findings={frame.neutralityFindings}
            final={frame.atEnd}
            copy={copy}
          />
        </div>
        <div className="absolute right-3 top-2 z-[60] sm:right-4">
          <ContextSettingsButton
            control={contextSettings}
            copy={copy}
            showCaptureSettings={false}
          />
        </div>
      </header>

      <ContextReplayTimeline
        durationMs={frame.durationMs}
        exact={frame.exact}
        events={replayEvents}
        timeline={replayTimeline}
        copy={copy}
      />

      <section className="min-h-0">
        <ContextDockview
          state={dockview}
          copy={copy}
          theme={contextTheme}
          graphTitle={copy.graph}
          graph={
            <>
              <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-md border border-rule bg-background/85 px-2.5 py-1.5 text-xs backdrop-blur">
                <span className="font-medium">{copy.graph}</span>
                <span className="ml-2 text-muted">
                  {frame.context.entities.length} {copy.entities} ·{" "}
                  {frame.context.relations.length} {copy.relations}
                </span>
              </div>
              <ContextGraph
                context={frame.context}
                enrichedEntities={entityMap}
                enrichedRelations={relationMap}
                copy={copy}
                onJumpToSentence={jumpToSentence}
                editable={
                  canManage && frame.atEnd && !verification.isVerifying
                }
                onRenameEntity={handleRenameEntity}
                onMergeEntities={handleMergeEntities}
                onRemoveEntity={handleRemoveEntity}
                colorMode={contextTheme}
                showMiniMap={contextSettings.settings.showMiniMap}
                animateRelations={contextSettings.settings.animateRelations}
              />
            </>
          }
          panels={{
            transcript: {
              title: copy.transcript,
              toneClass: "bg-violet-500",
              contentClassName: "overflow-hidden",
              content: diarization ? (
                <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
                  <div className="flex shrink-0 gap-1 border-b border-rule bg-paper/90 p-1.5">
                    <button
                      type="button"
                      aria-pressed={transcriptView === "replay"}
                      onClick={() => setTranscriptView("replay")}
                      className={`rounded-md px-2 py-1 text-[10px] font-semibold transition-colors ${
                        transcriptView === "replay"
                          ? "bg-foreground text-background"
                          : "text-muted hover:bg-foreground/10 hover:text-foreground"
                      }`}
                    >
                      {copy.transcript}
                    </button>
                    <button
                      type="button"
                      aria-pressed={transcriptView === "speakers"}
                      onClick={() => setTranscriptView("speakers")}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-colors ${
                        transcriptView === "speakers"
                          ? "bg-accent text-white"
                          : "text-muted hover:bg-foreground/10 hover:text-foreground"
                      }`}
                    >
                      <Users className="size-3" />
                      {t.live_diarized_transcript}
                    </button>
                  </div>
                  <div className="relative min-h-0 overflow-hidden">
                    <div
                      className={`h-full ${
                        transcriptView === "replay" ? "block" : "hidden"
                      }`}
                    >
                      <TranscriptStream
                        ref={transcriptRef}
                        transcript={frame.transcript}
                        variant="feed"
                      />
                    </div>
                    <div
                      className={`h-full overflow-y-auto p-2 ${
                        transcriptView === "speakers" ? "block" : "hidden"
                      }`}
                    >
                      <SavedDiarizedTranscript
                        ref={diarizedTranscriptRef}
                        diarization={diarization}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <TranscriptStream
                  ref={transcriptRef}
                  transcript={frame.transcript}
                  variant="feed"
                />
              ),
            },
            fallacies: {
              title: copy.fallacies,
              count: frame.findings.length,
              toneClass: "bg-rose-500",
              content: (
                <FindingsList
                  findings={frame.findings}
                  lang={lang}
                  showFallacyFilter
                />
              ),
            },
            facts: {
              title: copy.facts,
              count: frame.claims.length,
              toneClass: "bg-blue-500",
              content: (
                <>
                  {canManage && frame.atEnd ? (
                    <ContextClaimRecoveryAction
                      sessionId={id}
                      lang={lang}
                      initiallyComplete={claimRecoveryInitiallyComplete}
                      onRecovered={setCurrentClaims}
                    />
                  ) : null}
                  <p className="mb-2 rounded-md border border-blue-500/20 bg-blue-500/5 p-2 text-[10px] leading-snug text-muted">
                    {copy.detectedHint}
                  </p>
                  <LiveClaimsList
                    claims={frame.claims}
                    verdicts={verdictMap}
                    showStatusFilter
                    maxSources={contextSettings.settings.factSourceLimit}
                    sourcesInitiallyOpen={
                      contextSettings.settings.expandFactSources
                    }
                    verificationActions={
                      canManage && frame.atEnd
                        ? {
                            onVerify: (claimId) =>
                              void verification.startClaim(claimId),
                            verifyingClaimIds:
                              verification.verifyingClaimIds,
                            errors: verification.claimErrors,
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
              count:
                frame.context.tags?.length ?? 0,
              toneClass: "bg-emerald-500",
              content: (
                <ContextTopicsFeed
                  context={frame.context}
                  copy={copy}
                />
              ),
            },
            neutrality: {
              title: copy.neutrality,
              count: frame.neutralityFindings.length,
              toneClass: "bg-amber-500",
              content: (
                <LiveNeutralityList
                  findings={frame.neutralityFindings}
                  verdict={frame.neutralityVerdict}
                  showIssueFilter
                  verdictLabel={
                    frame.atEnd ? copy.finalAssessment : copy.currentAssessment
                  }
                />
              ),
            },
          }}
        />
      </section>
      {canManage ? (
        <ContextAnalysisSetupDialog
          key={
            analysisSetupOpen ? "analysis-setup-open" : "analysis-setup-closed"
          }
          open={analysisSetupOpen}
          action="save"
          config={currentContext.analysisConfig}
          lang={lang}
          onClose={() => setAnalysisSetupOpen(false)}
          onConfirm={saveAnalysisConfiguration}
        />
      ) : null}
    </main>
  );
}

async function refreshProfile(
  sessionId: string,
  language: Lang,
  entity: LiveContext["entities"][number],
  update: (profile: KnowledgeEntityDTO) => void,
) {
  try {
    const response = await fetch("/api/context/entities", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId, language, entity }),
    });
    if (!response.ok) return;
    const payload = (await response.json()) as {
      entity: KnowledgeEntityDTO;
      refreshScheduled?: boolean;
    };
    update(payload.entity);
    if (!payload.refreshScheduled) return;

    for (const delay of [1_200, 2_400, 4_800]) {
      await new Promise((resolve) => window.setTimeout(resolve, delay));
      const poll = await fetch(`/api/context/entities/${payload.entity.id}`);
      if (!poll.ok) continue;
      const next = (await poll.json()) as { entity: KnowledgeEntityDTO };
      update(next.entity);
      if (!next.entity.stale && next.entity.profileStatus !== "pending") break;
    }
  } catch {
    // Public enrichment is optional; the private correction is already saved.
  }
}
