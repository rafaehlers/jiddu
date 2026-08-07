"use client";

import { useEffect, useRef, useState } from "react";
import { readSse } from "@/lib/sse";
import type { Verdict } from "@/lib/verdict-schema";
import type { LiveClaim } from "./use-live-analysis";

export type LiveVerifyStatus = "none" | "running" | "complete" | "failed";

export type LiveClaimVerification = {
  verdicts: ReadonlyMap<string, Verdict>;
  status: LiveVerifyStatus;
  isVerifying: boolean;
  verifyingClaimIds: ReadonlySet<string>;
  claimErrors: ReadonlyMap<string, string>;
  progress: { done: number; total: number };
  error: string | null;
  start: () => Promise<void>;
  startClaim: (claimId: string) => Promise<void>;
  reset: () => void;
};

export function useLiveClaimVerification(
  factCheckId: string | null,
  claims: LiveClaim[],
  elapsedMs?: number,
): LiveClaimVerification {
  const [verdicts, setVerdicts] = useState<Map<string, Verdict>>(new Map());
  const [status, setStatus] = useState<LiveVerifyStatus>("none");
  const [verifyingClaimIds, setVerifyingClaimIds] = useState<Set<string>>(
    new Set(),
  );
  const [claimErrors, setClaimErrors] = useState<Map<string, string>>(
    new Map(),
  );
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const claimAbortRefs = useRef(new Map<string, AbortController>());
  const elapsedMsRef = useRef(elapsedMs);

  useEffect(() => {
    elapsedMsRef.current = elapsedMs;
  }, [elapsedMs]);

  function reset() {
    abortRef.current?.abort();
    abortRef.current = null;
    for (const controller of claimAbortRefs.current.values()) {
      controller.abort();
    }
    claimAbortRefs.current.clear();
    setVerdicts(new Map());
    setStatus("none");
    setVerifyingClaimIds(new Set());
    setClaimErrors(new Map());
    setProgress({ done: 0, total: 0 });
    setError(null);
  }

  useEffect(() => {
    const claimControllers = claimAbortRefs.current;
    return () => {
      abortRef.current?.abort();
      for (const controller of claimControllers.values()) {
        controller.abort();
      }
    };
  }, []);

  async function start() {
    if (
      !factCheckId ||
      claims.length === 0 ||
      status === "running" ||
      claimAbortRefs.current.size > 0
    ) {
      return;
    }

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
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
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

  async function startClaim(claimId: string) {
    if (
      !factCheckId ||
      status === "running" ||
      claimAbortRefs.current.has(claimId) ||
      !claims.some((claim) => claim.id === claimId)
    ) {
      return;
    }

    const controller = new AbortController();
    claimAbortRefs.current.set(claimId, controller);
    setVerifyingClaimIds((current) => new Set(current).add(claimId));
    setClaimErrors((current) => {
      if (!current.has(claimId)) return current;
      const next = new Map(current);
      next.delete(claimId);
      return next;
    });

    try {
      const response = await fetch(
        `/api/factcheck/${encodeURIComponent(factCheckId)}/claim/${encodeURIComponent(claimId)}/verify`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(
            elapsedMsRef.current == null
              ? {}
              : { elapsedMs: elapsedMsRef.current },
          ),
          signal: controller.signal,
        },
      );
      const data = (await response.json().catch(() => null)) as
        (Verdict & { error?: never }) | { error?: string } | null;
      if (!response.ok) {
        throw new Error(data?.error ?? `Request failed (${response.status})`);
      }
      const verdict = data as Verdict;
      setVerdicts((current) => {
        const next = new Map(current);
        next.set(claimId, verdict);
        return next;
      });
    } catch (verificationError) {
      if (controller.signal.aborted) return;
      setClaimErrors((current) => {
        const next = new Map(current);
        next.set(
          claimId,
          verificationError instanceof Error
            ? verificationError.message
            : String(verificationError),
        );
        return next;
      });
    } finally {
      if (claimAbortRefs.current.get(claimId) === controller) {
        claimAbortRefs.current.delete(claimId);
      }
      setVerifyingClaimIds((current) => {
        if (!current.has(claimId)) return current;
        const next = new Set(current);
        next.delete(claimId);
        return next;
      });
    }
  }

  return {
    verdicts,
    status,
    isVerifying: status === "running" || verifyingClaimIds.size > 0,
    verifyingClaimIds,
    claimErrors,
    progress,
    error,
    start,
    startClaim,
    reset,
  };
}
