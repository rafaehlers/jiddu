"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readSse } from "@/lib/sse";
import type { Finding } from "@/lib/schema";

type Options = {
  /** Cumulative transcript text from the live session. */
  transcript: string;
  /** Whether the live session is currently active (true → run the timer). */
  active: boolean;
  language: "en" | "pt" | "es";
  /**
   * Trigger an analyze call when the new transcript has at least this many
   * characters past the last successful run. Lower → more API calls + faster
   * feedback. Higher → cheaper but laggier.
   */
  minDeltaChars?: number;
  /** Minimum new text for the periodic slow-growth fallback. */
  timerMinDeltaChars?: number;
  /** Periodic timer in ms — fallback so we still call on slow growth. */
  intervalMs?: number;
};

type Result = {
  findings: Finding[];
  score: number | null;
  sessionId: string | null;
  /** True between firing an analyze call and getting the `done` event. */
  isAnalyzing: boolean;
  /** Last error from analyze; cleared on next successful call. */
  error: string | null;
  /**
   * Send the cumulative transcript with `finalize: true`. Resolves with the
   * session id (so the caller can redirect to the persisted analysis view).
   */
  finalize: () => Promise<string | null>;
};

export function useLiveAnalysis({
  transcript,
  active,
  language,
  minDeltaChars = 800,
  timerMinDeltaChars = 120,
  intervalMs = 30_000,
}: Options): Result {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Latest transcript / language values, accessible inside the timer +
  // finalize without re-creating the closures every keystroke. Refs are
  // synced via an effect (assigning during render trips React 19's lint).
  const transcriptRef = useRef(transcript);
  const languageRef = useRef(language);
  useEffect(() => {
    transcriptRef.current = transcript;
    languageRef.current = language;
  });
  const sessionIdRef = useRef<string | null>(null);
  const lastAnalyzedLengthRef = useRef(0);
  const inFlightRef = useRef(false);

  // Reset state when a fresh session begins (active flips false→true).
  const wasActiveRef = useRef(false);
  useEffect(() => {
    if (active && !wasActiveRef.current) {
      setFindings([]);
      setScore(null);
      setSessionId(null);
      sessionIdRef.current = null;
      lastAnalyzedLengthRef.current = 0;
      setError(null);
    }
    wasActiveRef.current = active;
  }, [active]);

  const runAnalyze = useCallback(
    async (finalize: boolean): Promise<string | null> => {
      if (inFlightRef.current) return sessionIdRef.current;
      const text = transcriptRef.current;
      if (!text && !finalize) return sessionIdRef.current;

      inFlightRef.current = true;
      setIsAnalyzing(true);
      const ctrl = new AbortController();

      try {
        const res = await fetch("/api/live/analyze", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            text,
            lang: languageRef.current,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            finalize,
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
          if (ev.event === "meta") {
            try {
              const meta = JSON.parse(ev.data) as { id: string };
              if (meta.id) {
                sessionIdRef.current = meta.id;
                setSessionId(meta.id);
              }
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
          } else if (ev.event === "done") {
            try {
              const data = JSON.parse(ev.data) as {
                id: string;
                score?: number;
                analyzed?: boolean;
                finalize?: boolean;
              };
              if (data.id) {
                sessionIdRef.current = data.id;
                setSessionId(data.id);
              }
              if (typeof data.score === "number") setScore(data.score);
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
          }
        }

        return sessionIdRef.current;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        return sessionIdRef.current;
      } finally {
        inFlightRef.current = false;
        setIsAnalyzing(false);
      }
    },
    [],
  );

  // Timer: fires every `intervalMs` while active. Also triggers immediately
  // whenever transcript length crosses the delta threshold (eager mode).
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

  // Eager trigger on transcript growth — debounced via inFlight guard.
  useEffect(() => {
    if (!active) return;
    const delta = transcript.length - lastAnalyzedLengthRef.current;
    if (delta >= minDeltaChars && !inFlightRef.current) {
      void runAnalyze(false);
    }
  }, [active, transcript, minDeltaChars, runAnalyze]);

  const finalize = useCallback(async () => {
    return runAnalyze(true);
  }, [runAnalyze]);

  return { findings, score, sessionId, isAnalyzing, error, finalize };
}
