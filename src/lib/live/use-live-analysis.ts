"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readSse } from "@/lib/sse";
import type { Finding } from "@/lib/schema";
import type { Claim } from "@/lib/claims-schema";
import type {
  NeutralityFinding,
  NeutralityVerdictValue,
} from "@/lib/neutrality-schema";
import type { LiveLens } from "@/lib/live-lenses";
import type { LiveAnalysisConfig } from "@/lib/live-analysis-config";
import {
  applyLiveAnalysisConfig,
  createLiveContextForAnalysis,
} from "@/lib/live-analysis-context";
import {
  EMPTY_LIVE_CONTEXT,
  LiveContextSchema,
  type LiveContext,
} from "@/lib/live-context-schema";

export type LiveClaim = Claim & { id: string };

export type LiveNeutralityVerdict = {
  verdict: NeutralityVerdictValue;
  confidence: number;
  rationale: string;
};

type Options = {
  /** Billing ticket returned with the Realtime client secret. */
  billingReservationId?: string | null;
  /** Cumulative transcript text from the live session. */
  transcript: string;
  /** Whether the live session is currently active (true → run the timer). */
  active: boolean;
  language: "en" | "pt" | "es";
  /** Listener-supplied page whose tab audio is being captured. */
  sourceUrl?: string | null;
  /** Current capture playhead, used to persist Context replay events. */
  elapsedMs?: number;
  lenses: LiveLens[];
  /** Minimum new text for the periodic slow-growth fallback. */
  timerMinDeltaChars?: number;
  /** Periodic analysis cadence in milliseconds. */
  intervalMs?: number;
  analysisConfig?: LiveAnalysisConfig;
};

type Result = {
  findings: Finding[];
  claims: LiveClaim[];
  neutralityFindings: NeutralityFinding[];
  neutralityVerdict: LiveNeutralityVerdict | null;
  context: LiveContext;
  score: number | null;
  sessionId: string | null;
  /** Model metadata reported by the active analysis pipeline. */
  model: string | null;
  provider: string | null;
  /** True between firing an analyze call and getting the `done` event. */
  isAnalyzing: boolean;
  /** Last error from analyze; cleared on next successful call. */
  error: string | null;
  lensErrors: Partial<Record<LiveLens, string>>;
  /**
   * Send the cumulative transcript with `finalize: true`. Resolves with the
   * session id (so the caller can redirect to the persisted analysis view).
   */
  finalize: (audioDurationMs?: number) => Promise<string | null>;
  /** Apply an owner-authored correction returned by the context session API. */
  applyContextMutation: (context: LiveContext, claims: LiveClaim[]) => void;
  /** Apply listener-supplied session structure immediately to the live graph. */
  updateAnalysisConfig: (config: LiveAnalysisConfig) => void;
  applyAnalysisConfiguration: (value: {
    context: LiveContext;
    claims: LiveClaim[];
    findings: Finding[];
    neutralityFindings: NeutralityFinding[];
  }) => void;
};

export function useLiveAnalysis({
  billingReservationId,
  transcript,
  active,
  language,
  sourceUrl = null,
  elapsedMs = 0,
  lenses,
  timerMinDeltaChars = 120,
  intervalMs = 30_000,
  analysisConfig = EMPTY_LIVE_CONTEXT.analysisConfig,
}: Options): Result {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [claims, setClaims] = useState<LiveClaim[]>([]);
  const [neutralityFindings, setNeutralityFindings] = useState<
    NeutralityFinding[]
  >([]);
  const [neutralityVerdict, setNeutralityVerdict] =
    useState<LiveNeutralityVerdict | null>(null);
  const [context, setContext] = useState<LiveContext>(EMPTY_LIVE_CONTEXT);
  const [score, setScore] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lensErrors, setLensErrors] = useState<
    Partial<Record<LiveLens, string>>
  >({});

  // Latest transcript / language values, accessible inside the timer +
  // finalize without re-creating the closures every keystroke. Refs are
  // synced via an effect (assigning during render trips React 19's lint).
  const transcriptRef = useRef(transcript);
  const languageRef = useRef(language);
  const sourceUrlRef = useRef(sourceUrl);
  const elapsedMsRef = useRef(elapsedMs);
  const lensesRef = useRef(lenses);
  const billingReservationIdRef = useRef(billingReservationId);
  const analysisConfigRef = useRef(analysisConfig);
  useEffect(() => {
    transcriptRef.current = transcript;
    languageRef.current = language;
    sourceUrlRef.current = sourceUrl;
    elapsedMsRef.current = elapsedMs;
    lensesRef.current = lenses;
    billingReservationIdRef.current = billingReservationId;
    analysisConfigRef.current = analysisConfig;
  });
  const sessionIdRef = useRef<string | null>(null);
  const lastAnalyzedLengthRef = useRef(0);
  const inFlightRef = useRef(false);
  const inFlightDoneRef = useRef<Promise<void> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);

  // Reset state when a fresh session begins (active flips false→true).
  const wasActiveRef = useRef(false);
  useEffect(() => {
    if (active && !wasActiveRef.current) {
      generationRef.current += 1;
      abortRef.current?.abort();
      abortRef.current = null;
      setFindings([]);
      setClaims([]);
      setNeutralityFindings([]);
      setNeutralityVerdict(null);
      setContext(
        createLiveContextForAnalysis(
          analysisConfigRef.current,
          languageRef.current,
        ),
      );
      setScore(null);
      setSessionId(null);
      setModel(null);
      setProvider(null);
      sessionIdRef.current = null;
      lastAnalyzedLengthRef.current = 0;
      setError(null);
      setLensErrors({});
    }
    wasActiveRef.current = active;
  }, [active]);

  useEffect(
    () => () => {
      generationRef.current += 1;
      abortRef.current?.abort();
      abortRef.current = null;
    },
    [],
  );

  const runAnalyze = useCallback(
    async (
      finalize: boolean,
      audioDurationMs?: number,
    ): Promise<string | null> => {
      if (inFlightRef.current) {
        if (!finalize) return sessionIdRef.current;
        // A stop can happen while a periodic analysis window is still
        // streaming. Wait for it, then send the final transcript so the row
        // is always completed and receives the final audio duration.
        await inFlightDoneRef.current;
      }
      const text = transcriptRef.current;
      if (!text && !finalize) return sessionIdRef.current;

      inFlightRef.current = true;
      let resolveInFlight: () => void = () => {};
      inFlightDoneRef.current = new Promise<void>((resolve) => {
        resolveInFlight = resolve;
      });
      setIsAnalyzing(true);
      const ctrl = new AbortController();
      const requestGeneration = generationRef.current;
      abortRef.current = ctrl;

      try {
        const res = await fetch("/api/live/analyze", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            billingReservationId: billingReservationIdRef.current,
            sessionId: sessionIdRef.current,
            text,
            sourceUrl: sourceUrlRef.current,
            lang: languageRef.current,
            lenses: lensesRef.current,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            elapsedMs: elapsedMsRef.current,
            finalize,
            audioDurationMs: finalize ? audioDurationMs : undefined,
            analysisConfig: analysisConfigRef.current,
          }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          const payload = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(payload?.error ?? `Analyze failed (${res.status})`);
        }

        for await (const ev of readSse(res, ctrl.signal)) {
          if (requestGeneration !== generationRef.current) break;
          if (ev.event === "meta") {
            try {
              const meta = JSON.parse(ev.data) as {
                id: string;
                model?: string;
                provider?: string;
              };
              if (meta.id) {
                sessionIdRef.current = meta.id;
                setSessionId(meta.id);
              }
              if (meta.model) setModel(meta.model);
              if (meta.provider) setProvider(meta.provider);
            } catch {
              /* ignore parse */
            }
          } else if (ev.event === "finding") {
            try {
              const f = JSON.parse(ev.data) as Finding;
              setFindings((prev) => {
                const key = `${[...f.sentenceIds].sort().join(",")}::${f.fallacy}`;
                if (
                  prev.some(
                    (p) =>
                      `${[...p.sentenceIds].sort().join(",")}::${p.fallacy}` ===
                      key,
                  )
                ) {
                  return prev;
                }
                return [...prev, f];
              });
            } catch {
              /* ignore */
            }
          } else if (ev.event === "claim") {
            try {
              const claim = JSON.parse(ev.data) as LiveClaim;
              setClaims((current) =>
                current.some((item) => item.id === claim.id)
                  ? current
                  : [...current, claim],
              );
            } catch {
              /* ignore */
            }
          } else if (ev.event === "neutralityFinding") {
            try {
              const finding = JSON.parse(ev.data) as NeutralityFinding;
              const key = neutralityFindingKey(finding);
              setNeutralityFindings((current) =>
                current.some((item) => neutralityFindingKey(item) === key)
                  ? current
                  : [...current, finding],
              );
            } catch {
              /* ignore */
            }
          } else if (ev.event === "neutralityReset") {
            setNeutralityFindings([]);
          } else if (ev.event === "neutralityVerdict") {
            try {
              setNeutralityVerdict(
                JSON.parse(ev.data) as LiveNeutralityVerdict,
              );
            } catch {
              /* ignore */
            }
          } else if (ev.event === "context") {
            try {
              const parsed = LiveContextSchema.safeParse(JSON.parse(ev.data));
              if (parsed.success) setContext(parsed.data);
            } catch {
              /* ignore */
            }
          } else if (ev.event === "done") {
            try {
              const data = JSON.parse(ev.data) as {
                id: string;
                score?: number;
                analyzed?: boolean;
                finalize?: boolean;
                neutrality?: LiveNeutralityVerdict;
                neutralityFindings?: NeutralityFinding[];
              };
              if (data.id) {
                sessionIdRef.current = data.id;
                setSessionId(data.id);
              }
              if (typeof data.score === "number") setScore(data.score);
              if (data.neutrality) {
                setNeutralityVerdict(data.neutrality);
              }
              if (Array.isArray(data.neutralityFindings)) {
                setNeutralityFindings(data.neutralityFindings);
              }
              if (data.analyzed || data.finalize) {
                lastAnalyzedLengthRef.current = text.length;
              }
            } catch {
              /* ignore */
            }
            setError(null);
          } else if (ev.event === "error") {
            try {
              const data = JSON.parse(ev.data) as { error?: string };
              if (data.error) setError(data.error);
            } catch {
              /* ignore */
            }
          } else if (ev.event === "lensError") {
            try {
              const data = JSON.parse(ev.data) as {
                lens?: LiveLens;
                error?: string;
              };
              if (data.lens && data.error) {
                setLensErrors((current) => ({
                  ...current,
                  [data.lens!]: data.error,
                }));
              }
            } catch {
              /* ignore */
            }
          }
        }

        return sessionIdRef.current;
      } catch (err) {
        if (ctrl.signal.aborted || requestGeneration !== generationRef.current) {
          return sessionIdRef.current;
        }
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        return sessionIdRef.current;
      } finally {
        if (abortRef.current === ctrl) abortRef.current = null;
        inFlightRef.current = false;
        resolveInFlight();
        inFlightDoneRef.current = null;
        setIsAnalyzing(false);
      }
    },
    [],
  );

  // Timer: the selected cadence is authoritative, so a one-minute interval
  // never fires early just because the speaker produced text quickly.
  useEffect(() => {
    if (!active) return;

    const tick = () => {
      const delta =
        transcriptRef.current.length - lastAnalyzedLengthRef.current;
      if (delta >= timerMinDeltaChars && !inFlightRef.current) {
        void runAnalyze(false);
      }
    };

    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [active, intervalMs, timerMinDeltaChars, runAnalyze]);

  const finalize = useCallback(
    async (audioDurationMs?: number) => {
      return runAnalyze(true, audioDurationMs);
    },
    [runAnalyze],
  );

  const applyContextMutation = useCallback(
    (nextContext: LiveContext, nextClaims: LiveClaim[]) => {
      analysisConfigRef.current = nextContext.analysisConfig;
      setContext(nextContext);
      setClaims(nextClaims);
    },
    [],
  );

  const updateAnalysisConfig = useCallback((nextConfig: LiveAnalysisConfig) => {
    analysisConfigRef.current = nextConfig;
    setContext((current) =>
      applyLiveAnalysisConfig(current, nextConfig, languageRef.current),
    );
  }, []);

  const applyAnalysisConfiguration = useCallback(
    (value: {
      context: LiveContext;
      claims: LiveClaim[];
      findings: Finding[];
      neutralityFindings: NeutralityFinding[];
    }) => {
      analysisConfigRef.current = value.context.analysisConfig;
      setContext(value.context);
      setClaims(value.claims);
      setFindings(value.findings);
      setNeutralityFindings(value.neutralityFindings);
    },
    [],
  );

  return {
    findings,
    claims,
    neutralityFindings,
    neutralityVerdict,
    context,
    score,
    sessionId,
    model,
    provider,
    isAnalyzing,
    error,
    lensErrors,
    finalize,
    applyContextMutation,
    updateAnalysisConfig,
    applyAnalysisConfiguration,
  };
}

function neutralityFindingKey(finding: NeutralityFinding): string {
  return `${[...finding.sentenceIds].sort().join(",")}::${finding.issue}`;
}
