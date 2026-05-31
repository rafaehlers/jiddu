"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Hash,
  Calendar,
  Quote,
  ArrowRight,
  Tag,
  Check,
  X,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Loader2,
  ShieldCheck,
  RefreshCw,
  Flag,
} from "lucide-react";
import type { Sentence } from "@/lib/schema";
import type { Claim, ClaimType } from "@/lib/claims-schema";
import type { Verdict, VerdictValue, SourceTier } from "@/lib/verdict-schema";
import { readSse } from "@/lib/sse";
import { cn } from "@/lib/utils";
import { ShareLinkBar } from "@/components/share-link-bar";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { useI18n } from "@/lib/i18n/provider";
import type { Messages } from "@/lib/i18n/messages";

type ClaimWithId = Claim & { id: string };

type Props = {
  id: string;
  title: string | null;
  sourceRef: string | null;
  source: string;
  text: string;
  sentences: Sentence[];
  claims: ClaimWithId[];
  status: string;
  provider: string;
  model: string;
  initialVerdicts: Verdict[];
  initialVerifyStatus: string;
  verifyModel: string | null;
  initialRefreshCounts: Record<string, number>;
  maxRefreshPerClaim: number;
};

const TYPE_META: Record<
  ClaimType,
  { icon: typeof Hash; labelKey: keyof Messages; cls: string }
> = {
  numeric: {
    icon: Hash,
    labelKey: "ct_numeric",
    cls: "border-blue-500/40 text-blue-500",
  },
  date: {
    icon: Calendar,
    labelKey: "ct_date",
    cls: "border-purple-500/40 text-purple-500",
  },
  quote: {
    icon: Quote,
    labelKey: "ct_quote",
    cls: "border-amber-500/40 text-amber-500",
  },
  causal: {
    icon: ArrowRight,
    labelKey: "ct_causal",
    cls: "border-emerald-500/40 text-emerald-500",
  },
  categorical: {
    icon: Tag,
    labelKey: "ct_categorical",
    cls: "border-pink-500/40 text-pink-500",
  },
};

// Explicit RGB values that mirror the Tailwind palette used in
// TYPE_META.cls above. Needed because mark.highlight reads its tint
// from a CSS custom property, and Tailwind class names don't carry a
// directly-readable color value. Keep these in sync with TYPE_META —
// changing one without the other will break the visual match between
// the sentence highlight and the claim-card dot.
const TYPE_COLOR: Record<ClaimType, string> = {
  numeric: "rgb(59, 130, 246)", // blue-500
  date: "rgb(168, 85, 247)", // purple-500
  quote: "rgb(245, 158, 11)", // amber-500
  causal: "rgb(16, 185, 129)", // emerald-500
  categorical: "rgb(236, 72, 153)", // pink-500
};

const VERDICT_META: Record<
  VerdictValue,
  { icon: typeof Check; labelKey: keyof Messages; cls: string }
> = {
  supported: {
    icon: Check,
    labelKey: "vd_supported",
    cls: "border-emerald-500/50 text-emerald-500 bg-emerald-500/5",
  },
  contradicted: {
    icon: X,
    labelKey: "vd_contradicted",
    cls: "border-red-500/50 text-red-500 bg-red-500/5",
  },
  mixed: {
    icon: AlertTriangle,
    labelKey: "vd_mixed",
    cls: "border-amber-500/50 text-amber-500 bg-amber-500/5",
  },
  unverified: {
    icon: HelpCircle,
    labelKey: "vd_unverified",
    cls: "border-rule text-muted bg-paper",
  },
};

function statusLabel(t: Messages, s: string): string {
  switch (s) {
    case "complete":
      return t.fc_status_complete;
    case "running":
      return t.fc_status_running;
    case "failed":
      return t.fc_status_failed;
    default:
      return t.fc_status_pending;
  }
}

export function FactCheckView({
  id,
  title,
  sourceRef,
  source,
  text,
  sentences,
  claims,
  status,
  model,
  initialVerdicts,
  initialVerifyStatus,
  verifyModel,
  initialRefreshCounts,
  maxRefreshPerClaim,
}: Props) {
  const { t } = useI18n();
  const claimsBySentence = useMemo(() => {
    const m = new Map<string, ClaimWithId[]>();
    for (const c of claims) {
      for (const sid of c.sentenceIds) {
        if (!m.has(sid)) m.set(sid, []);
        m.get(sid)!.push(c);
      }
    }
    return m;
  }, [claims]);

  const [active, setActive] = useState<string | null>(null);
  const [verdicts, setVerdicts] = useState<Map<string, Verdict>>(() => {
    const m = new Map<string, Verdict>();
    for (const v of initialVerdicts) m.set(v.claimId, v);
    return m;
  });
  const [verifyStatus, setVerifyStatus] = useState(initialVerifyStatus);
  const [verifyProgress, setVerifyProgress] = useState({ done: 0, total: 0 });
  const [verifyError, setVerifyError] = useState<string | null>(null);
  // Per-claim refresh state — keyed by claim id so multiple refreshes can
  // run independently without trampling each other's spinners.
  const [refreshing, setRefreshing] = useState<Set<string>>(new Set());
  const [refreshCounts, setRefreshCounts] =
    useState<Record<string, number>>(initialRefreshCounts);
  const abortRef = useRef<AbortController | null>(null);

  async function refreshClaim(claimId: string) {
    setRefreshing((s) => {
      const n = new Set(s);
      n.add(claimId);
      return n;
    });
    try {
      const res = await fetch(
        `/api/factcheck/${id}/claim/${claimId}/verify`,
        { method: "POST" },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? `Refresh failed (${res.status})`);
      }
      const data = (await res.json()) as Verdict & { refreshCount?: number };
      const verdict: Verdict = {
        claimId: data.claimId,
        verdict: data.verdict,
        confidence: data.confidence,
        rationale: data.rationale,
        sources: data.sources,
        model: data.model,
      };
      setVerdicts((prev) => {
        const next = new Map(prev);
        next.set(claimId, verdict);
        return next;
      });
      if (typeof data.refreshCount === "number") {
        setRefreshCounts((prev) => ({ ...prev, [claimId]: data.refreshCount! }));
      }
    } catch (err) {
      console.error("refreshClaim failed:", err);
    } finally {
      setRefreshing((s) => {
        const n = new Set(s);
        n.delete(claimId);
        return n;
      });
    }
  }

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function startVerify() {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setVerifyError(null);
    setVerifyStatus("running");
    setVerifyProgress({ done: 0, total: claims.length });
    setVerdicts(new Map());

    let res: Response;
    try {
      res = await fetch(`/api/factcheck/${id}/verify`, {
        method: "POST",
        signal: ctrl.signal,
      });
    } catch (err) {
      setVerifyStatus("failed");
      setVerifyError(err instanceof Error ? err.message : "Request failed");
      return;
    }
    if (!res.ok || !res.body) {
      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      setVerifyStatus("failed");
      setVerifyError(data?.error ?? `Request failed (${res.status})`);
      return;
    }

    for await (const ev of readSse(res, ctrl.signal)) {
      if (ev.event === "meta") {
        const m = JSON.parse(ev.data) as { claimCount: number };
        setVerifyProgress({ done: 0, total: m.claimCount });
      } else if (ev.event === "verdict") {
        const v = JSON.parse(ev.data) as Verdict;
        setVerdicts((prev) => {
          const next = new Map(prev);
          next.set(v.claimId, v);
          return next;
        });
        setVerifyProgress((p) => ({ done: p.done + 1, total: p.total }));
      } else if (ev.event === "claimError") {
        setVerifyProgress((p) => ({ done: p.done + 1, total: p.total }));
      } else if (ev.event === "done") {
        setVerifyStatus("complete");
        return;
      } else if (ev.event === "error") {
        const d = JSON.parse(ev.data) as { error: string };
        setVerifyStatus("failed");
        setVerifyError(d.error);
        return;
      }
    }
  }

  function scrollToClaim(claimId: string) {
    const el = document.getElementById(`claim-${claimId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setActive(claimId);
    }
  }

  function scrollToSentence(sentenceIds: string[]) {
    const sid = sentenceIds[0];
    const el = document.getElementById(`s-${sid}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  const paragraphs = useMemo(
    () => groupIntoParagraphs(text, sentences),
    [text, sentences],
  );

  const showVerifyButton =
    claims.length > 0 &&
    (verifyStatus === "none" || verifyStatus === "complete" || verifyStatus === "failed");
  const verifyRunning = verifyStatus === "running";

  return (
    <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-2xl sm:text-3xl leading-tight">
          {title ?? t.fc_untitled}
        </h1>
        {sourceRef && source === "url" && (
          <a
            href={sourceRef}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted hover:text-foreground transition-colors break-all"
          >
            {sourceRef}
          </a>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          <span>
            {claims.length}{" "}
            {claims.length === 1
              ? t.fc_claims_one_extracted
              : t.fc_claims_many_extracted}
          </span>
          <span>·</span>
          <span>{model}</span>
          <span>·</span>
          <span>{statusLabel(t, status)}</span>
          {verifyStatus !== "none" && (
            <>
              <span>·</span>
              <span>
                {t.fc_verify_label}: {statusLabel(t, verifyStatus)}
                {verifyModel ? ` (${verifyModel})` : null}
              </span>
            </>
          )}
        </div>
      </header>

      <ShareLinkBar rightSlot={<ExportPdfButton href={`/f/${id}/print`} />} />

      {/* Verify action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-paper border border-rule rounded-lg p-4">
        <div className="flex-1 flex items-start gap-2">
          <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5 text-muted" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">{t.fc_verify_panel_title}</p>
            <p className="text-xs text-muted leading-snug">
              {t.fc_verify_panel_desc}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {verifyRunning && (
            <span className="text-xs text-muted inline-flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {verifyProgress.done}/{verifyProgress.total}
            </span>
          )}
          {showVerifyButton && (
            <button
              type="button"
              onClick={startVerify}
              className="px-4 py-2 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {verifyStatus === "complete" || verifyStatus === "failed"
                ? t.fc_reverify_button
                : t.fc_verify_button}
            </button>
          )}
        </div>
      </div>

      {verifyError && (
        <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded-md p-3">
          {verifyError}
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_28rem] gap-6">
        {/* Left: text */}
        <article className="font-serif text-lg leading-relaxed text-balance bg-paper border border-rule rounded-lg p-6">
          {paragraphs.map((para, pIdx) => (
            <p key={pIdx} className={pIdx > 0 ? "mt-4" : undefined}>
              {para.map((s, sIdx) => {
                const claimsForSentence = claimsBySentence.get(s.id);
                const hasClaim = !!claimsForSentence?.length;
                if (!hasClaim) {
                  return (
                    <span key={s.id} id={`s-${s.id}`}>
                      {s.text}
                      {sIdx < para.length - 1 && " "}
                    </span>
                  );
                }
                // Multi-claim sentences: take the first claim's color
                // so the highlight aligns with the first card a click
                // would scroll to. Rare case.
                const firstClaim = claimsForSentence![0];
                const color =
                  TYPE_COLOR[firstClaim.type] ?? "currentColor";
                const isActive =
                  active &&
                  claimsForSentence!.some((c) => c.id === active);
                return (
                  <mark
                    key={s.id}
                    id={`s-${s.id}`}
                    className="highlight"
                    data-active={isActive ? "true" : undefined}
                    style={
                      {
                        "--highlight-color": color,
                      } as React.CSSProperties
                    }
                    onClick={() => scrollToClaim(firstClaim.id)}
                  >
                    {s.text}
                    {sIdx < para.length - 1 && " "}
                  </mark>
                );
              })}
            </p>
          ))}
        </article>

        {/* Right: claim list */}
        <aside className="flex flex-col gap-4">
          <h2 className="font-medium text-sm text-muted uppercase tracking-wide">
            {t.fc_claims_header} ({claims.length})
          </h2>
          {claims.length === 0 ? (
            <div className="text-sm text-muted bg-paper border border-rule rounded-lg p-6">
              {status === "running" ? t.fc_extracting : t.fc_no_claims}
            </div>
          ) : (
            <ol className="flex flex-col gap-3">
              {claims.map((c, idx) => {
                const used = refreshCounts[c.id] ?? 0;
                // Refresh button is shown both for claims with an existing
                // verdict (re-verify) and for claims without one (verify
                // now, no bulk required). The same per-claim counter caps
                // both flows.
                const canRefresh = !verifyRunning && used < maxRefreshPerClaim;
                return (
                  <ClaimCard
                    key={c.id}
                    claim={c}
                    index={idx}
                    verdict={verdicts.get(c.id) ?? null}
                    verifying={
                      (verifyRunning && !verdicts.has(c.id)) ||
                      refreshing.has(c.id)
                    }
                    refreshing={refreshing.has(c.id)}
                    onRefresh={canRefresh ? () => refreshClaim(c.id) : undefined}
                    refreshUsed={used}
                    refreshMax={maxRefreshPerClaim}
                    factCheckId={id}
                    active={active === c.id}
                    onClick={() => {
                      setActive(c.id);
                      scrollToSentence(c.sentenceIds);
                    }}
                  />
                );
              })}
            </ol>
          )}
        </aside>
      </div>

      <p className="text-xs text-muted mt-2">{t.fc_footer(model)}</p>
    </div>
  );
}

function ClaimCard({
  claim,
  index,
  verdict,
  verifying,
  refreshing,
  onRefresh,
  refreshUsed,
  refreshMax,
  factCheckId,
  active,
  onClick,
}: {
  claim: ClaimWithId;
  index: number;
  verdict: Verdict | null;
  verifying: boolean;
  refreshing: boolean;
  onRefresh?: () => void;
  refreshUsed: number;
  refreshMax: number;
  factCheckId: string;
  active: boolean;
  onClick: () => void;
}) {
  const { t } = useI18n();
  const meta = TYPE_META[claim.type] ?? TYPE_META.categorical;
  const Icon = meta.icon;
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [reportState, setReportState] = useState<
    "idle" | "sending" | "sent"
  >("idle");
  const vMeta = verdict ? VERDICT_META[verdict.verdict] : null;
  const VIcon = vMeta?.icon;

  async function reportWrong(e: React.MouseEvent) {
    e.stopPropagation();
    if (reportState !== "idle") return;
    const reason = window.prompt(t.fc_report_prompt) ?? "";
    // null = user clicked Cancel — abort silently. Empty string still
    // counts as a flag (the verdict is wrong, no explanation given).
    if (reason === null) return;
    setReportState("sending");
    try {
      await fetch(`/api/factcheck/${factCheckId}/claim/${claim.id}/feedback`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      setReportState("sent");
    } catch {
      setReportState("idle");
    }
  }

  return (
    <li
      id={`claim-${claim.id}`}
      className={cn(
        "bg-paper border border-rule rounded-lg p-4 flex flex-col gap-2 cursor-pointer transition-colors",
        active && "border-foreground",
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted font-mono inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: TYPE_COLOR[claim.type] }}
          />
          #{index + 1}
        </span>
        <div className="flex items-center gap-1.5">
          {verifying && (
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t.fc_checking}
            </span>
          )}
          {vMeta && VIcon && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border",
                vMeta.cls,
              )}
            >
              <VIcon className="h-3 w-3" />
              {t[vMeta.labelKey] as string}
              {verdict && (
                <span className="ml-1 opacity-70">
                  {Math.round(verdict.confidence * 100)}%
                </span>
              )}
            </span>
          )}
          {onRefresh ? (
            <button
              type="button"
              title={`${
                verdict ? t.fc_reverify_button : t.fc_verify_button
              } (${refreshUsed}/${refreshMax})`}
              onClick={(e) => {
                e.stopPropagation();
                onRefresh();
              }}
              disabled={refreshing}
              className="text-muted hover:text-foreground transition-colors disabled:opacity-50 inline-flex items-center gap-1"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
              />
              <span className="text-[10px] font-mono opacity-70">
                {refreshUsed}/{refreshMax}
              </span>
            </button>
          ) : (
            refreshUsed >= refreshMax && (
              <span
                title="Refresh cap reached"
                className="text-[10px] font-mono text-muted opacity-60"
              >
                {refreshUsed}/{refreshMax}
              </span>
            )
          )}
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border",
              meta.cls,
            )}
          >
            <Icon className="h-3 w-3" />
            {t[meta.labelKey] as string}
          </span>
        </div>
      </div>

      <p className="text-sm leading-relaxed">{claim.statement}</p>

      {verdict ? (
        <p className="text-xs leading-snug">{verdict.rationale}</p>
      ) : (
        <p className="text-xs text-muted leading-snug">{claim.rationale}</p>
      )}

      {verdict && (
        <>
          <div className="mt-1 flex items-center gap-4 flex-wrap">
            {verdict.sources.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSourcesOpen((o) => !o);
                }}
                className="text-xs text-muted hover:text-foreground transition-colors"
              >
                {sourcesOpen
                  ? t.fc_hide_sources(verdict.sources.length)
                  : t.fc_show_sources(verdict.sources.length)}
              </button>
            )}
            {reportState === "sent" ? (
              <span className="text-xs text-muted ml-auto">
                {t.fc_report_thanks}
              </span>
            ) : (
              <button
                type="button"
                onClick={reportWrong}
                disabled={reportState === "sending"}
                title={t.fc_report_wrong}
                className="text-xs text-muted hover:text-[var(--severity-high)] transition-colors inline-flex items-center gap-1 disabled:opacity-50 ml-auto"
              >
                <Flag className="h-3 w-3" />
                {t.fc_report_wrong}
              </button>
            )}
          </div>
          {sourcesOpen && (
            <ul className="mt-2 flex flex-col gap-2">
              {verdict.sources.map((s, i) => (
                <li key={i} className="text-xs flex flex-col gap-1">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-start gap-1 text-muted hover:text-foreground transition-colors break-all"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0 mt-0.5" />
                    <span>{s.title ?? s.url}</span>
                  </a>
                  {(s.tier || s.stateControlled) && (
                    <div className="flex items-center gap-1.5 flex-wrap ml-4">
                      {s.tier && <SourceTierBadge tier={s.tier} />}
                      {s.stateControlled && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border border-[var(--severity-high)]/50 text-[var(--severity-high)]"
                          title={t.st_state_controlled}
                        >
                          ⚠ {t.st_state_controlled}
                        </span>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </li>
  );
}

// Per-tier visual identity. The "primary" / "scholarly" tiers earn the
// most legible colors; commercial and informal are dimmed to signal
// lower trust at a glance.
const TIER_BADGE_CLS: Record<SourceTier, string> = {
  primary: "border-emerald-500/50 text-emerald-500",
  scholarly: "border-blue-500/50 text-blue-500",
  think_tank: "border-purple-500/40 text-purple-500",
  journalistic: "border-rule text-foreground",
  commercial_content: "border-amber-500/40 text-amber-500",
  informal: "border-rule text-muted",
};

function SourceTierBadge({ tier }: { tier: SourceTier }) {
  const { t } = useI18n();
  const labelKey =
    `st_${tier}` as
      | "st_primary"
      | "st_scholarly"
      | "st_think_tank"
      | "st_journalistic"
      | "st_commercial_content"
      | "st_informal";
  return (
    <span
      className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full border ${TIER_BADGE_CLS[tier]}`}
    >
      {t[labelKey]}
    </span>
  );
}

function groupIntoParagraphs(
  text: string,
  sentences: Sentence[],
): Sentence[][] {
  if (sentences.length === 0) return [];
  const groups: Sentence[][] = [[sentences[0]]];
  for (let i = 1; i < sentences.length; i++) {
    const prev = sentences[i - 1];
    const cur = sentences[i];
    const between = text.slice(prev.end, cur.start);
    if (/\n\s*\n/.test(between)) {
      groups.push([cur]);
    } else {
      groups[groups.length - 1].push(cur);
    }
  }
  return groups;
}
