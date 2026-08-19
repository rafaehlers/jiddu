"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ScanSearch,
} from "lucide-react";
import { useState } from "react";
import type { ContextReplayEvent } from "@/lib/context-replay-schema";
import type { Lang } from "@/lib/fallacies";
import type { LiveClaim } from "@/lib/live/use-live-analysis";

type RecoveryResult = {
  claims: LiveClaim[];
  addedCount: number;
  claimCount: number;
  maxClaims: number;
  hasMore: boolean;
  atLimit: boolean;
};

type RecoveryState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "more"; addedCount: number }
  | { status: "complete"; addedCount: number | null }
  | { status: "limit"; maxClaims: number }
  | { status: "error"; message: string };

export function ContextClaimRecoveryAction({
  sessionId,
  lang,
  initiallyComplete = false,
  onRecovered,
}: {
  sessionId: string;
  lang: Lang;
  initiallyComplete?: boolean;
  onRecovered: (claims: LiveClaim[]) => void;
}) {
  const copy = recoveryCopy(lang);
  const [state, setState] = useState<RecoveryState>(
    initiallyComplete
      ? { status: "complete", addedCount: null }
      : { status: "idle" },
  );

  async function recover() {
    setState({ status: "running" });
    try {
      const response = await fetch(
        `/api/context/sessions/${encodeURIComponent(sessionId)}/claims/recover`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ lang }),
        },
      );
      const payload = (await response.json().catch(() => null)) as
        | (Partial<RecoveryResult> & { error?: string })
        | null;
      if (!response.ok || !payload) {
        throw new Error(payload?.error ?? copy.error);
      }
      if (
        !Array.isArray(payload.claims) ||
        typeof payload.addedCount !== "number" ||
        typeof payload.maxClaims !== "number"
      ) {
        throw new Error(copy.error);
      }
      onRecovered(payload.claims as LiveClaim[]);
      if (payload.atLimit) {
        setState({ status: "limit", maxClaims: payload.maxClaims });
      } else if (payload.hasMore) {
        setState({ status: "more", addedCount: payload.addedCount });
      } else {
        setState({
          status: "complete",
          addedCount: payload.addedCount,
        });
      }
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : copy.error,
      });
    }
  }

  if (state.status === "complete") {
    return (
      <div className="mb-2 flex items-start gap-2 rounded-md border border-emerald-500/25 bg-emerald-500/5 p-2 text-[11px] text-muted">
        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
        <span>
          {state.addedCount === null
            ? copy.alreadyReviewed
            : state.addedCount > 0
              ? copy.added(state.addedCount)
              : copy.noneFound}
        </span>
      </div>
    );
  }

  return (
    <div className="mb-2 rounded-md border border-blue-500/25 bg-blue-500/5 p-2.5">
      <div className="flex items-start gap-2">
        {state.status === "limit" || state.status === "error" ? (
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
        ) : (
          <ScanSearch className="mt-0.5 size-4 shrink-0 text-blue-500" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground">
            {copy.title}
          </p>
          <p className="mt-0.5 text-[10px] leading-snug text-muted">
            {state.status === "limit"
              ? copy.limit(state.maxClaims)
              : state.status === "more"
                ? copy.addedWithMore(state.addedCount)
                : state.status === "error"
                  ? state.message
                  : copy.description}
          </p>
        </div>
        {state.status !== "limit" ? (
          <button
            type="button"
            onClick={() => void recover()}
            disabled={state.status === "running"}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {state.status === "running" ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <ScanSearch className="size-3" />
            )}
            {state.status === "running"
              ? copy.reviewing
              : state.status === "more"
                ? copy.continue
                : state.status === "error"
                  ? copy.retry
                  : copy.action}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function hasCompletedClaimRecovery(
  events: ContextReplayEvent[],
): boolean {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.kind !== "operation_completed") continue;
    const payload = event.payload as Record<string, unknown> | null;
    if (payload?.operation !== "claims_recovery") continue;
    return payload.complete === true;
  }
  return false;
}

function recoveryCopy(lang: Lang) {
  return {
    en: {
      title: "Check for facts that may have been missed",
      description:
        "Review the remaining transcript and add only new factual claims. This uses analysis credits.",
      action: "Review transcript",
      reviewing: "Reviewing…",
      continue: "Continue review",
      retry: "Try again",
      error: "The transcript could not be reviewed.",
      added: (count: number) =>
        `${count} new ${count === 1 ? "fact was" : "facts were"} added.`,
      addedWithMore: (count: number) =>
        `${count} new ${count === 1 ? "fact was" : "facts were"} added. More transcript remains.`,
      noneFound: "The transcript was reviewed and no new facts were found.",
      alreadyReviewed: "The remaining transcript has already been reviewed for facts.",
      limit: (limit: number) =>
        `This analysis reached the configured limit of ${limit} facts.`,
    },
    pt: {
      title: "Buscar fatos que podem ter ficado de fora",
      description:
        "Revise o restante do transcript e adicione somente afirmações factuais novas. Esta ação utiliza créditos de análise.",
      action: "Revisar transcript",
      reviewing: "Revisando…",
      continue: "Continuar revisão",
      retry: "Tentar novamente",
      error: "Não foi possível revisar o transcript.",
      added: (count: number) =>
        `${count} ${count === 1 ? "novo fato foi adicionado" : "novos fatos foram adicionados"}.`,
      addedWithMore: (count: number) =>
        `${count} ${count === 1 ? "novo fato foi adicionado" : "novos fatos foram adicionados"}. Ainda há transcript para revisar.`,
      noneFound: "O transcript foi revisado e nenhum fato novo foi encontrado.",
      alreadyReviewed: "O restante do transcript já foi revisado em busca de fatos.",
      limit: (limit: number) =>
        `Esta análise atingiu o limite configurado de ${limit} fatos.`,
    },
    es: {
      title: "Buscar hechos que pueden haber quedado fuera",
      description:
        "Revisa el resto de la transcripción y añade solo afirmaciones factuales nuevas. Esta acción utiliza créditos de análisis.",
      action: "Revisar transcripción",
      reviewing: "Revisando…",
      continue: "Continuar revisión",
      retry: "Intentar de nuevo",
      error: "No se pudo revisar la transcripción.",
      added: (count: number) =>
        `Se ${count === 1 ? "añadió 1 hecho nuevo" : `añadieron ${count} hechos nuevos`}.`,
      addedWithMore: (count: number) =>
        `Se ${count === 1 ? "añadió 1 hecho nuevo" : `añadieron ${count} hechos nuevos`}. Queda más transcripción por revisar.`,
      noneFound: "Se revisó la transcripción y no se encontraron hechos nuevos.",
      alreadyReviewed: "El resto de la transcripción ya fue revisado en busca de hechos.",
      limit: (limit: number) =>
        `Este análisis alcanzó el límite configurado de ${limit} hechos.`,
    },
  }[lang];
}
