"use client";

import { useI18n } from "@/lib/i18n/provider";
import type { NeutralityFinding } from "@/lib/neutrality-schema";
import type { LiveNeutralityVerdict } from "@/lib/live/use-live-analysis";
import { cn } from "@/lib/utils";
import {
  NEUTRALITY_ISSUE_META,
  NEUTRALITY_VERDICT_META,
} from "@/components/neutrality-visuals";
import { LiveResultTypeBadge } from "./result-type-badge";
import { UserRound } from "lucide-react";

type Props = {
  findings: NeutralityFinding[];
  verdict: LiveNeutralityVerdict | null;
  showLensBadge?: boolean;
  verdictLabel?: string;
};

export function LiveNeutralityList({
  findings,
  verdict,
  showLensBadge = false,
  verdictLabel,
}: Props) {
  const { t } = useI18n();
  if (findings.length === 0 && !verdict) {
    return (
      <div className="text-sm italic text-muted">
        {t.live_no_neutrality_yet}
      </div>
    );
  }

  const verdictMeta = verdict
    ? NEUTRALITY_VERDICT_META[verdict.verdict]
    : null;
  const VerdictIcon = verdictMeta?.icon;

  return (
    <div className="space-y-3">
      {verdict && verdictMeta && VerdictIcon ? (
        <div className={cn("rounded-md border p-3", verdictMeta.cls)}>
          <div className="flex items-start gap-3">
            <VerdictIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {showLensBadge ? (
                    <LiveResultTypeBadge lens="neutrality" />
                  ) : null}
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    {verdictLabel ?? t.live_partial_verdict}
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {t[verdictMeta.labelKey] as string}
                </span>
              </div>
              <p className="mt-1 text-xs opacity-75">
                {t.live_confidence}: {Math.round(verdict.confidence * 100)}%
              </p>
              {verdict.rationale ? (
                <p className="mt-2 text-sm text-foreground">
                  {verdict.rationale}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <ul className="space-y-2">
        {findings.map((finding, index) => {
          const issueMeta = NEUTRALITY_ISSUE_META[finding.issue];
          const IssueIcon = issueMeta.icon;

          return (
            <li
              key={`${finding.sentenceIds.join("-")}-${finding.issue}-${index}`}
              className="rounded-md border border-rule bg-paper p-3"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {showLensBadge ? (
                    <LiveResultTypeBadge lens="neutrality" />
                  ) : null}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
                      issueMeta.cls,
                    )}
                  >
                    <IssueIcon aria-hidden="true" className="size-3" />
                    {t[issueMeta.labelKey] as string}
                  </span>
                  {finding.speakerName ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/35 bg-sky-500/5 px-2 py-0.5 text-xs text-sky-500">
                      <UserRound className="size-3" />
                      {finding.speakerName}
                    </span>
                  ) : null}
                </div>
                <span className="text-xs uppercase tracking-wide text-muted">
                  {finding.severity === "high"
                    ? t.severity_high
                    : t.severity_low}
                </span>
              </div>
              {finding.quote ? (
                <blockquote className="mb-1 border-l-2 border-rule pl-2 text-sm italic text-muted">
                  “{finding.quote}”
                </blockquote>
              ) : null}
              <p className="text-sm">{finding.explanation}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
