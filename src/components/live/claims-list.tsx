"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  ExternalLink,
  HelpCircle,
  Loader2,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import type { Messages } from "@/lib/i18n/messages";
import type { ClaimType } from "@/lib/claims-schema";
import type { LiveClaim } from "@/lib/live/use-live-analysis";
import type { Verdict, VerdictValue } from "@/lib/verdict-schema";
import { LiveResultTypeBadge } from "./result-type-badge";

type Props = {
  claims: LiveClaim[];
  verdicts?: ReadonlyMap<string, Verdict>;
  verifying?: boolean;
  showLensBadge?: boolean;
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
}: Props) {
  const { t } = useI18n();
  if (claims.length === 0) {
    return <div className="text-sm italic text-muted">{t.live_no_claims_yet}</div>;
  }

  return (
    <ul className="space-y-2">
      {claims.map((claim) => {
        const verdict = verdicts.get(claim.id) ?? null;
        return (
          <LiveClaimCard
            key={claim.id}
            claim={claim}
            verdict={verdict}
            verifying={verifying && !verdict}
            showLensBadge={showLensBadge}
          />
        );
      })}
    </ul>
  );
}

function LiveClaimCard({
  claim,
  verdict,
  verifying,
  showLensBadge,
}: {
  claim: LiveClaim;
  verdict: Verdict | null;
  verifying: boolean;
  showLensBadge: boolean;
}) {
  const { t } = useI18n();
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const verdictMeta = verdict ? VERDICT_META[verdict.verdict] : null;
  const VerdictIcon = verdictMeta?.icon;

  return (
    <li className="rounded-md border border-rule bg-paper p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {showLensBadge ? (
            <LiveResultTypeBadge lens="factcheck" />
          ) : null}
          <span className="rounded border border-blue-500/40 px-2 py-0.5 text-xs text-blue-500">
            {t[CLAIM_LABEL[claim.type]] as string}
          </span>
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

      {verdict && verdict.sources.length > 0 ? (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setSourcesOpen((open) => !open)}
            className="text-xs text-muted transition-colors hover:text-foreground"
          >
            {sourcesOpen
              ? t.fc_hide_sources(verdict.sources.length)
              : t.fc_show_sources(verdict.sources.length)}
          </button>
          {sourcesOpen ? (
            <ul className="mt-2 space-y-2">
              {verdict.sources.map((source, index) => (
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
