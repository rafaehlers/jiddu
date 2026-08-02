"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import type { PaperReviewStageTiming } from "@/lib/paper-review-telemetry";

type JobStatus = {
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
    title: "Your adversarial review is processing",
    body: "You can leave this page or close Jiddu. The job will keep running on the server and its status will appear in your account.",
    account: "View jobs in your account",
    stage: "Current stage",
    failed: "The review could not be completed",
    retry: "Start another review",
    signIn: "Sign in again to keep checking this job.",
    timeline: "Processing timeline",
    complete: "Complete",
    running: "Running",
    failedStatus: "Failed",
  },
  pt: {
    title: "Sua revisão adversarial está sendo processada",
    body: "Você pode sair desta página ou fechar o Jiddu. O job continuará rodando no servidor e o status aparecerá na sua conta.",
    account: "Ver jobs na sua conta",
    stage: "Etapa atual",
    failed: "Não foi possível concluir a revisão",
    retry: "Iniciar outra revisão",
    signIn: "Entre novamente para continuar acompanhando este job.",
    timeline: "Linha do tempo do processamento",
    complete: "Concluída",
    running: "Em andamento",
    failedStatus: "Falhou",
  },
  es: {
    title: "Tu revisión adversarial se está procesando",
    body: "Puedes salir de esta página o cerrar Jiddu. El job seguirá ejecutándose en el servidor y su estado aparecerá en tu cuenta.",
    account: "Ver jobs en tu cuenta",
    stage: "Etapa actual",
    failed: "No se pudo completar la revisión",
    retry: "Iniciar otra revisión",
    signIn: "Vuelve a iniciar sesión para seguir este job.",
    timeline: "Cronología del procesamiento",
    complete: "Completada",
    running: "En curso",
    failedStatus: "Falló",
  },
} as const;

const STAGE_LABELS: Record<string, { en: string; pt: string; es: string }> = {
  ingest: { en: "Reading the PDF", pt: "Lendo o PDF", es: "Leyendo el PDF" },
  ledger: { en: "Mapping claims and evidence", pt: "Mapeando argumentos e evidências", es: "Mapeando argumentos y evidencias" },
  research: { en: "Checking published literature", pt: "Verificando a literatura publicada", es: "Verificando la literatura publicada" },
  specs: { en: "Running specialist reviews", pt: "Executando as revisões especialistas", es: "Ejecutando las revisiones especialistas" },
  verification: { en: "Verifying computations", pt: "Verificando os cálculos", es: "Verificando los cálculos" },
  synthesis: { en: "Synthesizing the review", pt: "Sintetizando a revisão", es: "Sintetizando la revisión" },
  self_critique: { en: "Challenging the first draft", pt: "Criticando a primeira versão", es: "Cuestionando la primera versión" },
  source_validation: { en: "Validating sources", pt: "Validando as fontes", es: "Validando las fuentes" },
  quality_audit: { en: "Auditing review quality", pt: "Auditando a qualidade da revisão", es: "Auditando la calidad de la revisión" },
  finalize: { en: "Finalizing the result", pt: "Finalizando o resultado", es: "Finalizando el resultado" },
  complete: { en: "Complete", pt: "Concluída", es: "Completada" },
};

export function PaperReviewJobStatus({
  initialJob,
}: {
  initialJob: JobStatus;
}) {
  const router = useRouter();
  const { lang } = useI18n();
  const copy = COPY[lang];
  const [job, setJob] = useState(initialJob);
  const [pollError, setPollError] = useState<string | null>(null);
  const [now, setNow] = useState(() =>
    new Date(initialJob.observedAt).getTime(),
  );
  const active = job.status === "pending" || job.status === "running";

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const response = await fetch(`/api/review/${job.id}`, {
          cache: "no-store",
        });
        if (response.status === 401) {
          if (!cancelled) setPollError(copy.signIn);
          return;
        }
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const next = (await response.json()) as JobStatus;
        if (cancelled) return;
        setJob(next);
        setPollError(null);
        if (next.status === "complete") {
          router.refresh();
          return;
        }
        if (next.status === "failed") return;
      } catch {
        if (!cancelled) {
          setPollError(
            lang === "pt"
              ? "Não foi possível atualizar o status agora. Tentaremos novamente."
              : lang === "es"
                ? "No se pudo actualizar el estado. Lo intentaremos de nuevo."
                : "The status could not be refreshed. We will try again.",
          );
        }
      }
      if (!cancelled) timer = setTimeout(poll, 10_000);
    };

    timer = setTimeout(poll, 5_000);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [active, copy.signIn, job.id, lang, router]);

  const percent = Math.max(
    4,
    Math.min(
      100,
      Math.round(
        (job.progress.completedStages / job.progress.totalStages) * 100,
      ),
    ),
  );
  const stage = STAGE_LABELS[job.stage]?.[lang] ?? job.stage;

  if (job.status === "failed") {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-6 py-16">
        <h1 className="font-serif text-3xl">{copy.failed}</h1>
        <p className="text-[var(--severity-high)]">
          {job.error ?? "The background job stopped before it completed."}
        </p>
        <JobTimeline timeline={job.timeline} lang={lang} copy={copy} now={now} />
        <div className="flex flex-wrap gap-3">
          <Link href="/review" className="rounded-md bg-accent px-4 py-2 text-sm text-white">
            {copy.retry}
          </Link>
          <Link href="/account?tab=analyses" className="rounded-md border border-rule px-4 py-2 text-sm">
            {copy.account}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-7 px-6 py-16">
      <div className="flex items-start gap-4">
        <Loader2 className="mt-1 size-6 shrink-0 animate-spin text-muted" />
        <div className="min-w-0">
          <h1 className="font-serif text-3xl">{copy.title}</h1>
          <p className="mt-2 truncate text-sm text-muted">
            {job.title ?? job.sourceRef ?? "Adversarial paper review"}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-rule bg-paper p-5">
        <div className="mb-3 flex items-center justify-between gap-4 text-sm">
          <span>{copy.stage}: {stage}</span>
          <span className="tabular-nums text-muted">
            {job.progress.completedStages}/{job.progress.totalStages}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-background" aria-label={`${percent}%`}>
          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <p className="max-w-2xl text-foreground/85">{copy.body}</p>
      {pollError && <p role="status" className="text-sm text-muted">{pollError}</p>}

      <JobTimeline timeline={job.timeline} lang={lang} copy={copy} now={now} />

      <div>
        <Link href="/account?tab=analyses" className="inline-flex rounded-md border border-rule px-4 py-2 text-sm">
          {copy.account} →
        </Link>
      </div>
    </section>
  );
}

function JobTimeline({
  timeline,
  lang,
  copy,
  now,
}: {
  timeline: PaperReviewStageTiming[];
  lang: "en" | "pt" | "es";
  copy: (typeof COPY)[keyof typeof COPY];
  now: number;
}) {
  if (timeline.length === 0) return null;
  return (
    <section className="rounded-lg border border-rule bg-paper p-5">
      <h2 className="font-serif text-2xl">{copy.timeline}</h2>
      <ol className="mt-4 flex flex-col gap-4">
        {timeline.map((timing) => (
          <li key={timing.index} className="border-l border-rule pl-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium">
                {STAGE_LABELS[timing.name]?.[lang] ?? humanize(timing.name)}
              </p>
              <span className="text-xs text-muted tabular-nums">
                {statusLabel(timing.status, copy)} ·{" "}
                {formatDuration(durationFor(timing, now))}
              </span>
            </div>
            {timing.calls.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1.5 text-sm">
                {timing.calls.map((call) => (
                  <li
                    key={call.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-muted"
                  >
                    <span>
                      {humanize(call.operation)} ·{" "}
                      <span className="text-foreground/80">{call.model}</span>
                    </span>
                    <span className="tabular-nums">
                      {statusLabel(call.status, copy)} ·{" "}
                      {formatDuration(
                        call.durationMs ??
                          Math.max(
                            0,
                            now - new Date(call.startedAt).getTime(),
                          ),
                      )}
                    </span>
                    {call.status === "failed" && call.error && (
                      <span className="basis-full text-xs text-[var(--severity-high)]">
                        {call.error}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {timing.status === "failed" &&
              timing.error &&
              timing.calls.length === 0 && (
                <p className="mt-2 text-xs text-[var(--severity-high)]">
                  {timing.error}
                </p>
              )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function durationFor(timing: PaperReviewStageTiming, now: number): number {
  return (
    timing.durationMs ?? Math.max(0, now - new Date(timing.startedAt).getTime())
  );
}

function formatDuration(durationMs: number): string {
  const seconds = Math.max(0, Math.round(durationMs / 1_000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder.toString().padStart(2, "0")}s`;
}

function humanize(value: string): string {
  const text = value.replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function statusLabel(
  status: "running" | "complete" | "failed",
  copy: (typeof COPY)[keyof typeof COPY],
): string {
  if (status === "complete") return copy.complete;
  if (status === "failed") return copy.failedStatus;
  return copy.running;
}
