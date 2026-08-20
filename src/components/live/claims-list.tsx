"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ExternalLink,
  HelpCircle,
  Loader2,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { FactCheckStatusFilterBar } from "@/components/factcheck-status-filter-bar";
import type { Messages } from "@/lib/i18n/messages";
import type { ClaimType } from "@/lib/claims-schema";
import type { LiveClaim } from "@/lib/live/use-live-analysis";
import type { Verdict, VerdictValue } from "@/lib/verdict-schema";
import {
  factCheckClaimMatchesStatus,
  factCheckStatusCounts,
  type FactCheckStatusFilter,
} from "@/lib/factcheck-status-filter";
import { LiveResultTypeBadge } from "./result-type-badge";

type Props = {
  claims: LiveClaim[];
  verdicts?: ReadonlyMap<string, Verdict>;
  verifying?: boolean;
  showLensBadge?: boolean;
  maxSources?: number;
  sourcesInitiallyOpen?: boolean;
  showStatusFilter?: boolean;
  verificationActions?: {
    onVerify: (claimId: string) => void;
    verifyingClaimIds: ReadonlySet<string>;
    errors: ReadonlyMap<string, string>;
    refreshCounts?: Readonly<Record<string, number>>;
    maxRefreshPerClaim?: number;
    limitReachedLabel?: (limit: number) => string;
    verifyLabel: string;
    reverifyLabel: string;
    verifyingLabel: string;
  };
};

const CLAIM_LABEL: Record<ClaimType, keyof Messages> = {
  numeric: "ct_numeric",
  date: "ct_date",
  quote: "ct_quote",
  causal: "ct_causal",
  categorical: "ct_categorical",
};

const VERDICT_META: Record<
  VerdictValue,
  {
    icon: typeof Check;
    labelKey: keyof Messages;
    className: string;
  }
> = {
  supported: {
    icon: Check,
    labelKey: "vd_supported",
    className: "border-emerald-500/50 bg-emerald-500/5 text-emerald-500",
  },
  contradicted: {
    icon: X,
    labelKey: "vd_contradicted",
    className: "border-red-500/50 bg-red-500/5 text-red-500",
  },
  mixed: {
    icon: AlertTriangle,
    labelKey: "vd_mixed",
    className: "border-amber-500/50 bg-amber-500/5 text-amber-500",
  },
  unverified: {
    icon: HelpCircle,
    labelKey: "vd_unverified",
    className: "border-rule bg-paper text-muted",
  },
};

export function LiveClaimsList({
  claims,
  verdicts = new Map(),
  verifying = false,
  showLensBadge = false,
  maxSources = Number.POSITIVE_INFINITY,
  sourcesInitiallyOpen = false,
  showStatusFilter = false,
  verificationActions,
}: Props) {
  const { t } = useI18n();
  const [statusFilter, setStatusFilter] =
    useState<FactCheckStatusFilter>("all");
  const statusCounts = useMemo(
    () => factCheckStatusCounts(claims.map((claim) => claim.id), verdicts),
    [claims, verdicts],
  );
  const visibleClaims = useMemo(
    () =>
      claims.filter((claim) =>
        factCheckClaimMatchesStatus(claim.id, verdicts, statusFilter),
      ),
    [claims, verdicts, statusFilter],
  );

  if (claims.length === 0) {
    return (
      <div className="text-sm italic text-muted">{t.live_no_claims_yet}</div>
    );
  }

  return (
    <div className="space-y-2">
      {showStatusFilter ? (
        <FactCheckStatusFilterBar
          value={statusFilter}
          counts={statusCounts}
          onChange={setStatusFilter}
          className="pb-1"
        />
      ) : null}
      {visibleClaims.length === 0 ? (
        <div className="rounded-md border border-rule bg-paper p-3 text-sm text-muted">
          {t.fc_filter_empty}
        </div>
      ) : (
        <ul className="space-y-2">
          {visibleClaims.map((claim) => {
            const verdict = verdicts.get(claim.id) ?? null;
            const verifyingThisClaim =
              (verifying && !verdict) ||
              verificationActions?.verifyingClaimIds.has(claim.id) === true;
            const verificationLimitReached = Boolean(
              verificationActions &&
                verificationActions.refreshCounts &&
                verificationActions.maxRefreshPerClaim != null &&
                (verificationActions.refreshCounts[claim.id] ?? 0) >=
                  verificationActions.maxRefreshPerClaim,
            );
            return (
              <LiveClaimCard
                key={`${claim.id}:${sourcesInitiallyOpen ? "open" : "closed"}`}
                claim={claim}
                verdict={verdict}
                verifying={verifyingThisClaim}
                verificationLocked={verifying}
                showLensBadge={showLensBadge}
                maxSources={maxSources}
                sourcesInitiallyOpen={sourcesInitiallyOpen}
                verificationActions={
                  verificationActions
                    ? {
                        onVerify: verificationActions.onVerify,
                        error:
                          verificationActions.errors.get(claim.id) ?? null,
                        limitReached: verificationLimitReached,
                        limitReachedLabel:
                          verificationActions.limitReachedLabel?.(
                            verificationActions.maxRefreshPerClaim ?? 0,
                          ) ?? "",
                        verifyLabel: verificationActions.verifyLabel,
                        reverifyLabel: verificationActions.reverifyLabel,
                        verifyingLabel: verificationActions.verifyingLabel,
                      }
                    : null
                }
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}

function LiveClaimCard({
  claim,
  verdict,
  verifying,
  verificationLocked,
  showLensBadge,
  maxSources,
  sourcesInitiallyOpen,
  verificationActions,
}: {
  claim: LiveClaim;
  verdict: Verdict | null;
  verifying: boolean;
  verificationLocked: boolean;
  showLensBadge: boolean;
  maxSources: number;
  sourcesInitiallyOpen: boolean;
  verificationActions: {
    onVerify: (claimId: string) => void;
    error: string | null;
    limitReached: boolean;
    limitReachedLabel: string;
    verifyLabel: string;
    reverifyLabel: string;
    verifyingLabel: string;
  } | null;
}) {
  const { t } = useI18n();
  const [sourcesOpen, setSourcesOpen] = useState(sourcesInitiallyOpen);
  const verdictMeta = verdict ? VERDICT_META[verdict.verdict] : null;
  const VerdictIcon = verdictMeta?.icon;
  const visibleSources = verdict
    ? verdict.sources.slice(0, normalizeSourceLimit(maxSources))
    : [];

  return (
    <li className="rounded-md border border-rule bg-paper p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {showLensBadge ? <LiveResultTypeBadge lens="factcheck" /> : null}
          <span className="rounded border border-blue-500/40 px-2 py-0.5 text-xs text-blue-500">
            {t[CLAIM_LABEL[claim.type]] as string}
          </span>
          {claim.speakerName ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/35 bg-sky-500/5 px-2 py-0.5 text-xs text-sky-500">
              <UserRound className="size-3" />
              {claim.speakerName}
            </span>
          ) : null}
        </div>

        {verifying ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <Loader2 className="size-3 animate-spin" />
            {t.fc_checking}
          </span>
        ) : verdict && verdictMeta && VerdictIcon ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${verdictMeta.className}`}
          >
            <VerdictIcon className="size-3" />
            {t[verdictMeta.labelKey] as string}
            <span className="ml-1 opacity-70">
              {Math.round(verdict.confidence * 100)}%
            </span>
          </span>
        ) : (
          <span className="text-xs text-muted">{t.live_claim_detected}</span>
        )}
      </div>

      <p className="text-sm font-medium">{claim.statement}</p>
      <p className={`mt-1 text-sm ${verdict ? "" : "text-muted"}`}>
        {verdict?.rationale ?? claim.rationale}
      </p>

      {verificationActions ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-2">
          {verificationActions.error || verificationActions.limitReached ? (
            <p
              className={`min-w-0 flex-1 text-xs ${
                verificationActions.limitReached
                  ? "text-amber-500"
                  : "text-red-500"
              }`}
            >
              {verificationActions.limitReached
                ? verificationActions.limitReachedLabel
                : verificationActions.error}
            </p>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => verificationActions.onVerify(claim.id)}
            disabled={
              verifying ||
              verificationLocked ||
              verificationActions.limitReached
            }
            title={
              verificationActions.limitReached
                ? verificationActions.limitReachedLabel
                : undefined
            }
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-blue-500/40 px-2 py-1 text-xs font-medium text-blue-500 transition-colors hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {verifying ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <ShieldCheck className="size-3" />
            )}
            {verifying
              ? verificationActions.verifyingLabel
              : verdict
                ? verificationActions.reverifyLabel
                : verificationActions.verifyLabel}
          </button>
        </div>
      ) : null}

      {verdict && visibleSources.length > 0 ? (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setSourcesOpen((open) => !open)}
            className="text-xs text-muted transition-colors hover:text-foreground"
          >
            {sourcesOpen
              ? t.fc_hide_sources(visibleSources.length)
              : t.fc_show_sources(visibleSources.length)}
          </button>
          {sourcesOpen ? (
            <ul className="mt-2 space-y-2">
              {visibleSources.map((source, index) => (
                <li key={`${source.url}-${index}`} className="text-xs">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-1 break-all text-muted transition-colors hover:text-foreground"
                  >
                    <ExternalLink className="mt-0.5 size-3 shrink-0" />
                    <span>{source.title ?? source.url}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function normalizeSourceLimit(value: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 10_000;
}
