"use client";

import { useEffect, useRef, useState } from "react";
import { readSse } from "@/lib/sse";
import type { Verdict } from "@/lib/verdict-schema";
import type { LiveClaim } from "./use-live-analysis";

export type LiveVerifyStatus = "none" | "running" | "complete" | "failed";

export type LiveClaimVerification = {
  verdicts: ReadonlyMap<string, Verdict>;
  status: LiveVerifyStatus;
  progress: { done: number; total: number };
  error: string | null;
  start: () => Promise<void>;
  reset: () => void;
};

export function useLiveClaimVerification(
  factCheckId: string | null,
  claims: LiveClaim[],
): LiveClaimVerification {
  const [verdicts, setVerdicts] = useState<Map<string, Verdict>>(new Map());
  const [status, setStatus] = useState<LiveVerifyStatus>("none");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function reset() {
    abortRef.current?.abort();
    abortRef.current = null;
    setVerdicts(new Map());
    setStatus("none");
    setProgress({ done: 0, total: 0 });
    setError(null);
  }

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function start() {
    if (!factCheckId || claims.length === 0 || status === "running") return;

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    setStatus("running");
    setProgress({ done: 0, total: claims.length });
    setError(null);

    try {
      const response = await fetch(`/api/factcheck/${factCheckId}/verify`, {
        method: "POST",
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? `Request failed (${response.status})`);
      }

      let completed = false;
      for await (const event of readSse(response, controller.signal)) {
        if (event.event === "meta") {
          const data = JSON.parse(event.data) as { claimCount?: number };
          setProgress({ done: 0, total: data.claimCount ?? claims.length });
        } else if (event.event === "verdict") {
          const verdict = JSON.parse(event.data) as Verdict;
          setVerdicts((current) => {
            const next = new Map(current);
            next.set(verdict.claimId, verdict);
            return next;
          });
          setProgress((current) => ({
            ...current,
            done: current.done + 1,
          }));
        } else if (event.event === "claimError") {
          setProgress((current) => ({
            ...current,
            done: current.done + 1,
          }));
        } else if (event.event === "done") {
          completed = true;
          setStatus("complete");
        } else if (event.event === "error") {
          const data = JSON.parse(event.data) as { error?: string };
          throw new Error(data.error ?? "Verification failed");
        }
      }

      if (!completed && !controller.signal.aborted) {
        throw new Error("Verification ended before completion");
      }
    } catch (verificationError) {
      if (controller.signal.aborted) return;
      setStatus("failed");
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : String(verificationError),
      );
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  return { verdicts, status, progress, error, start, reset };
}
