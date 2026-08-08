"use client";

import { useEffect, useRef, useState } from "react";
import { LIVE_TRANSCRIPTION_MODEL } from "@/lib/model-ids";
import type { useLiveAnalysis } from "@/lib/live/use-live-analysis";
import type {
  LiveClaimVerification,
} from "@/lib/live/use-live-claim-verification";
import type { LiveSource, useLiveSession } from "@/lib/live/use-live-session";
import type { useContextEnrichment } from "./use-context-enrichment";
import {
  useContextEventPersistence,
  useContextSessionStoreApi,
} from "./context-session-store-provider";
import type {
  ContextPipelineAgent,
  ContextPipelineAgentKind,
} from "./context-session-store";

type LiveSessionResult = ReturnType<typeof useLiveSession>;
type LiveAnalysisResult = ReturnType<typeof useLiveAnalysis>;
type ContextEnrichmentResult = ReturnType<typeof useContextEnrichment>;

export function useContextSessionBridge(input: {
  source: LiveSource;
  session: LiveSessionResult;
  analysis: LiveAnalysisResult;
  verification: LiveClaimVerification;
  enrichment: ContextEnrichmentResult;
  analysisProcesses: number;
  newsModel: string;
  verificationModel: string;
}) {
  const store = useContextSessionStoreApi();
  const agentStartedAt = useRef(new Map<ContextPipelineAgentKind, number>());
  const [agentClock, setAgentClock] = useState(0);
  const hasActivePipeline =
    input.session.state === "connecting" ||
    input.session.state === "live" ||
    input.analysis.isAnalyzing ||
    input.enrichment.activity.profileRequests > 0 ||
    input.enrichment.activity.newsRequests > 0 ||
    input.verification.status === "running" ||
    input.verification.verifyingClaimIds.size > 0;

  useEffect(() => {
    if (!hasActivePipeline) return;
    const interval = window.setInterval(
      () => setAgentClock((current) => current + 1),
      1_000,
    );
    return () => window.clearInterval(interval);
  }, [hasActivePipeline]);

  useEffect(() => {
    store.getState().syncCapture({
      state: input.session.state,
      source: input.source,
      transcript: input.session.transcript,
      error: input.session.error,
      billingReservationId: input.session.billingReservationId,
      localAudioUrl: input.session.localAudioUrl,
      elapsedMs: input.session.elapsedMs,
    });
  }, [
    input.session.billingReservationId,
    input.session.elapsedMs,
    input.session.error,
    input.session.localAudioUrl,
    input.session.state,
    input.session.transcript,
    input.source,
    store,
  ]);

  useEffect(() => {
    store.getState().syncAnalysis({
      findings: input.analysis.findings,
      claims: input.analysis.claims,
      neutralityFindings: input.analysis.neutralityFindings,
      neutralityVerdict: input.analysis.neutralityVerdict,
      context: input.analysis.context,
      score: input.analysis.score,
      sessionId: input.analysis.sessionId,
      model: input.analysis.model,
      provider: input.analysis.provider,
      isAnalyzing: input.analysis.isAnalyzing,
      error: input.analysis.error,
    });
  }, [
    input.analysis.claims,
    input.analysis.context,
    input.analysis.error,
    input.analysis.findings,
    input.analysis.isAnalyzing,
    input.analysis.model,
    input.analysis.neutralityFindings,
    input.analysis.neutralityVerdict,
    input.analysis.provider,
    input.analysis.score,
    input.analysis.sessionId,
    store,
  ]);

  useEffect(() => {
    store.getState().syncVerification({
      verdicts: input.verification.verdicts,
      verifyingClaimIds: input.verification.verifyingClaimIds,
      claimErrors: input.verification.claimErrors,
      isVerifying: input.verification.isVerifying,
    });
  }, [
    input.verification.claimErrors,
    input.verification.isVerifying,
    input.verification.verdicts,
    input.verification.verifyingClaimIds,
    store,
  ]);

  useEffect(() => {
    store.getState().syncEnrichment({
      entities: input.enrichment.entities,
      relations: input.enrichment.relations,
      errors: input.enrichment.errors,
      profileRequests: input.enrichment.activity.profileRequests,
      newsRequests: input.enrichment.activity.newsRequests,
    });
  }, [
    input.enrichment.activity.newsRequests,
    input.enrichment.activity.profileRequests,
    input.enrichment.entities,
    input.enrichment.errors,
    input.enrichment.relations,
    store,
  ]);

  useEffect(() => {
    const agents: ContextPipelineAgent[] = [];
    const add = (
      id: ContextPipelineAgentKind,
      values: Omit<ContextPipelineAgent, "id" | "startedAt" | "durationMs">,
    ) => {
      const startedAt = agentStartedAt.current.get(id) ?? Date.now();
      agentStartedAt.current.set(id, startedAt);
      agents.push({
        id,
        startedAt,
        durationMs: Math.max(0, Date.now() - startedAt),
        ...values,
      });
    };

    if (
      input.session.state === "connecting" ||
      input.session.state === "live"
    ) {
      add("capture", {
        processes: 1,
        requests: 1,
        model: LIVE_TRANSCRIPTION_MODEL,
        provider: "OpenAI",
      });
    }
    if (input.analysis.isAnalyzing) {
      add("analysis", {
        processes: Math.max(1, input.analysisProcesses),
        requests: 1,
        model: input.analysis.model,
        provider: input.analysis.provider,
      });
    }
    if (input.enrichment.activity.profileRequests > 0) {
      add("profiles", {
        processes: input.enrichment.activity.profileRequests,
        requests: input.enrichment.activity.profileRequests,
        model: null,
        provider: null,
      });
    }
    if (input.enrichment.activity.newsRequests > 0) {
      add("news", {
        processes: input.enrichment.activity.newsRequests,
        requests: input.enrichment.activity.newsRequests,
        model: input.newsModel,
        provider: "OpenRouter",
      });
    }
    const verificationRequests =
      input.verification.status === "running"
        ? 1
        : input.verification.verifyingClaimIds.size;
    if (verificationRequests > 0) {
      add("verification", {
        processes: verificationRequests,
        requests: verificationRequests,
        model: input.verificationModel,
        provider: "OpenRouter",
      });
    }

    const activeIds = new Set(agents.map((agent) => agent.id));
    for (const id of agentStartedAt.current.keys()) {
      if (!activeIds.has(id)) agentStartedAt.current.delete(id);
    }
    store.getState().syncAgents(agents);
  }, [
    agentClock,
    input.analysis.isAnalyzing,
    input.analysis.model,
    input.analysis.provider,
    input.analysisProcesses,
    input.enrichment.activity.newsRequests,
    input.enrichment.activity.profileRequests,
    input.newsModel,
    input.session.elapsedMs,
    input.session.state,
    input.verification.status,
    input.verification.verifyingClaimIds,
    input.verificationModel,
    store,
  ]);

  useContextEventPersistence(input.analysis.sessionId);
}
