"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, MessageCircleQuestion } from "lucide-react";
import type { Lang } from "@/lib/fallacies";
import type { Messages } from "@/lib/i18n/messages";

type DetailState = {
  status: "loading" | "complete" | "error";
  expanded: boolean;
  explanation?: string;
  error?: "auth" | "credits" | "rate" | "generic";
};

export function useExplainDetails(id: string, lang: Lang) {
  const [states, setStates] = useState<Record<string, DetailState>>({});
  const requests = useRef(new Map<string, AbortController>());
  const keyFor = (blockId: string) => `${id}:${lang}:${blockId}`;

  useEffect(() => {
    const pending = requests.current;
    return () => {
      for (const controller of pending.values()) controller.abort();
      pending.clear();
    };
  }, []);

  async function toggle(blockId: string) {
    const key = keyFor(blockId);
    if (requests.current.has(key)) return;
    if (states[key]?.status === "complete") {
      setStates((current) => ({
        ...current,
        [key]: { ...current[key], expanded: !current[key].expanded },
      }));
      return;
    }

    const controller = new AbortController();
    requests.current.set(key, controller);
    setStates((current) => ({
      ...current,
      [key]: { status: "loading", expanded: true },
    }));
    try {
      const response = await fetch(`/api/explain/${encodeURIComponent(id)}/detail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockId, lang }),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || typeof data?.explanation !== "string" || !data.explanation.trim()) {
        const error = response.status === 401 ? "auth"
          : response.status === 402 ? "credits"
            : response.status === 429 ? "rate" : "generic";
        setStates((current) => ({
          ...current,
          [key]: { status: "error", expanded: true, error },
        }));
        return;
      }
      setStates((current) => ({
        ...current,
        [key]: { status: "complete", expanded: true, explanation: data.explanation.trim() },
      }));
    } catch {
      if (!controller.signal.aborted) {
        setStates((current) => ({
          ...current,
          [key]: { status: "error", expanded: true, error: "generic" },
        }));
      }
    } finally {
      requests.current.delete(key);
    }
  }

  return { states, get: (blockId: string) => states[keyFor(blockId)], toggle };
}

export function ExplainDetail({
  state,
  onToggle,
  panelId,
  levelLabel,
  t,
}: {
  state: DetailState | undefined;
  onToggle: () => void;
  panelId: string;
  levelLabel: string;
  t: Messages;
}) {
  const loading = state?.status === "loading";
  const complete = state?.status === "complete";
  const expanded = Boolean(state?.expanded);
  const Icon = loading ? Loader2 : complete
    ? expanded ? ChevronUp : ChevronDown
    : MessageCircleQuestion;

  return (
    <div className="mt-1 border-t border-rule pt-2" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        disabled={loading}
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        title={t.explain_detail_hint(levelLabel)}
        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md px-2 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-wait disabled:opacity-70"
      >
        <Icon aria-hidden="true" className={`size-3.5 shrink-0${loading ? " animate-spin" : ""}`} />
        {loading ? t.explain_detail_loading : complete
          ? expanded ? t.explain_detail_hide : t.explain_detail_show
          : state?.status === "error" ? t.explain_detail_retry : t.explain_detail_button}
      </button>
      <div id={panelId} hidden={!expanded} aria-busy={loading} aria-live="polite" className="cursor-auto">
        {loading && <p className="pt-2 text-xs leading-relaxed text-muted">{t.explain_detail_hint(levelLabel)}</p>}
        {complete && (
          <div className="space-y-3 pt-3 text-sm leading-relaxed text-foreground">
            <p className="text-xs font-medium text-muted">{t.explain_detail_hint(levelLabel)}</p>
            {state.explanation?.split(/\n\s*\n/).map((paragraph, index) => (
              <p key={index} className="whitespace-pre-line">{paragraph}</p>
            ))}
          </div>
        )}
        {state?.status === "error" && (
          <div role="alert" className="space-y-2 pt-2 text-xs leading-relaxed text-muted">
            <p>{state.error === "auth" ? t.auth_required_title
              : state.error === "credits" ? t.credits_required_title
                : state.error === "rate" ? t.explain_detail_rate_limit : t.explain_detail_error}</p>
            {state.error === "auth" && <a className="text-accent underline" href="/login">{t.auth_sign_in}</a>}
            {state.error === "credits" && <a className="text-accent underline" href="/account">{t.credits_open_account}</a>}
          </div>
        )}
      </div>
    </div>
  );
}
