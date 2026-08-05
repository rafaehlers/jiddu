"use client";

import { CheckCircle2, Loader2, TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useI18n } from "@/lib/i18n/provider";
import type { PaperReviewStageTiming } from "@/lib/paper-review-telemetry";
import {
  addDismissedReviewJobId,
  parseDismissedReviewJobIds,
  REVIEW_JOB_DISMISSALS_STORAGE_KEY,
} from "@/lib/review-job-dismissals";

type ReviewJob = {
  id: string;
  status: string;
  stage: string;
  title: string | null;
  sourceRef: string | null;
  progress: {
    completedStages: number;
    totalStages: number;
  };
  timeline: PaperReviewStageTiming[];
  error: string | null;
  viewerUrl: string;
  observedAt: string;
  createdAt: string;
  finishedAt: string | null;
};

const COPY = {
  en: {
    running: "Review in progress",
    runningBody: "You can close Jiddu. This background job will keep running and this notice will update automatically.",
    complete: "Review ready",
    completeBody: "Your adversarial review finished processing.",
    failed: "Review stopped",
    open: "Open review",
    dismiss: "Dismiss notification",
  },
  pt: {
    running: "Revisão em andamento",
    runningBody: "Você pode fechar o Jiddu. Este job continuará rodando em segundo plano e o aviso será atualizado automaticamente.",
    complete: "Revisão pronta",
    completeBody: "Sua revisão adversarial terminou de ser processada.",
    failed: "A revisão foi interrompida",
    open: "Abrir revisão",
    dismiss: "Dispensar aviso",
  },
  es: {
    running: "Revisión en curso",
    runningBody: "Puedes cerrar Jiddu. Este job seguirá ejecutándose en segundo plano y el aviso se actualizará automáticamente.",
    complete: "Revisión lista",
    completeBody: "Tu revisión adversarial terminó de procesarse.",
    failed: "La revisión se interrumpió",
    open: "Abrir revisión",
    dismiss: "Descartar aviso",
  },
} as const;

const REVIEW_JOB_DISMISSALS_UPDATED_EVENT =
  "jiddu:review-job-dismissals-updated";

function subscribeToReviewJobDismissals(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (
      event.key !== null &&
      event.key !== REVIEW_JOB_DISMISSALS_STORAGE_KEY
    ) {
      return;
    }
    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(
    REVIEW_JOB_DISMISSALS_UPDATED_EVENT,
    onStoreChange,
  );
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(
      REVIEW_JOB_DISMISSALS_UPDATED_EVENT,
      onStoreChange,
    );
  };
}

function getReviewJobDismissalsSnapshot(): string | null {
  try {
    return window.localStorage.getItem(REVIEW_JOB_DISMISSALS_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerReviewJobDismissalsSnapshot(): undefined {
  return undefined;
}

export function AccountReviewJobs({
  initialJobs,
}: {
  initialJobs: ReviewJob[];
}) {
  const router = useRouter();
  const { lang } = useI18n();
  const copy = COPY[lang];
  const [jobs, setJobs] = useState(initialJobs);
  const [sessionDismissed, setSessionDismissed] = useState<string[]>([]);
  const dismissalSnapshot = useSyncExternalStore(
    subscribeToReviewJobDismissals,
    getReviewJobDismissalsSnapshot,
    getServerReviewJobDismissalsSnapshot,
  );
  const persistedDismissed = useMemo(
    () => parseDismissedReviewJobIds(dismissalSnapshot ?? null),
    [dismissalSnapshot],
  );
  const dismissed = useMemo(
    () => Array.from(new Set([...persistedDismissed, ...sessionDismissed])),
    [persistedDismissed, sessionDismissed],
  );
  const [now, setNow] = useState(() =>
    initialJobs[0]
      ? new Date(initialJobs[0].observedAt).getTime()
      : new Date(0).getTime(),
  );
  const hasActive = jobs.some(
    (job) => job.status === "pending" || job.status === "running",
  );

  useEffect(() => {
    if (!hasActive) return;
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [hasActive]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const response = await fetch("/api/account/review-jobs", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as { jobs: ReviewJob[] };
        if (cancelled) return;
        const completedNow = jobs.some((current) => {
          if (current.status !== "pending" && current.status !== "running") {
            return false;
          }
          const next = data.jobs.find((job) => job.id === current.id);
          return next?.status === "complete" || next?.status === "failed";
        });
        setJobs(data.jobs);
        if (completedNow) router.refresh();
      } catch {
        // Keep the last known state; the next poll will try again.
      } finally {
        if (!cancelled) {
          timer = setTimeout(poll, hasActive ? 10_000 : 60_000);
        }
      }
    };

    timer = setTimeout(poll, hasActive ? 10_000 : 60_000);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [hasActive, jobs, router]);

  const notices = useMemo(() => {
    const active = jobs.filter(
      (job) => job.status === "pending" || job.status === "running",
    );
    const latestFinished = jobs.find(
      (job) => job.status === "complete" || job.status === "failed",
    );
    return [...active, ...(latestFinished ? [latestFinished] : [])].filter(
      (job) => !dismissed.includes(job.id),
    );
  }, [dismissed, jobs]);

  if (dismissalSnapshot === undefined || notices.length === 0) return null;

  const dismiss = (jobId: string) => {
    const next = addDismissedReviewJobId(dismissed, jobId);
    try {
      window.localStorage.setItem(
        REVIEW_JOB_DISMISSALS_STORAGE_KEY,
        JSON.stringify(next),
      );
      window.dispatchEvent(new Event(REVIEW_JOB_DISMISSALS_UPDATED_EVENT));
    } catch {
      // Keep the dismissal for this page view when storage is unavailable.
      setSessionDismissed((ids) => addDismissedReviewJobId(ids, jobId));
    }
  };

  return (
    <section aria-label="Adversarial review jobs" className="flex flex-col gap-3">
      {notices.map((job) => {
        const running = job.status === "pending" || job.status === "running";
        const complete = job.status === "complete";
        const timing =
          job.timeline.find((stage) => stage.status === "running") ??
          job.timeline.at(-1);
        return (
          <div
            key={job.id}
            role="status"
            className="flex items-start gap-3 rounded-lg border border-rule bg-paper p-4 sm:p-5"
          >
            {running ? (
              <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin text-muted" />
            ) : complete ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            ) : (
              <TriangleAlert className="mt-0.5 size-5 shrink-0 text-[var(--severity-high)]" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {running ? copy.running : complete ? copy.complete : copy.failed}
              </p>
              <p className="mt-1 truncate text-sm text-foreground/85">
                {job.title ?? job.sourceRef ?? "Adversarial paper review"}
              </p>
              {timing && (
                <p className="mt-1 text-xs text-muted tabular-nums">
                  {humanize(timing.name)} ·{" "}
                  {formatDuration(
                    timing.durationMs ??
                      Math.max(
                        0,
                        now - new Date(timing.startedAt).getTime(),
                      ),
                  )}
                </p>
              )}
              <p className="mt-1 text-sm text-muted">
                {running
                  ? copy.runningBody
                  : complete
                    ? copy.completeBody
                    : job.error ?? copy.failed}
              </p>
              <Link href={job.viewerUrl} className="mt-3 inline-flex text-sm">
                {copy.open} →
              </Link>
            </div>
            {!running && (
              <button
                type="button"
                onClick={() => dismiss(job.id)}
                className="rounded p-1 text-muted hover:text-foreground"
                aria-label={copy.dismiss}
                title={copy.dismiss}
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        );
      })}
    </section>
  );
}

function formatDuration(durationMs: number): string {
  const seconds = Math.max(0, Math.round(durationMs / 1_000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${(seconds % 60).toString().padStart(2, "0")}s`;
}

function humanize(value: string): string {
  const text = value.replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
