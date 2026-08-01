"use client";

import { useI18n } from "@/lib/i18n/provider";
import type { Messages } from "@/lib/i18n/messages";
import type {
  NeutralityFinding,
  NeutralityIssue,
  NeutralityVerdictValue,
} from "@/lib/neutrality-schema";
import type { LiveNeutralityVerdict } from "@/lib/live/use-live-analysis";
import { LiveResultTypeBadge } from "./result-type-badge";

type Props = {
  findings: NeutralityFinding[];
  verdict: LiveNeutralityVerdict | null;
  showLensBadge?: boolean;
};

const ISSUE_LABEL: Record<NeutralityIssue, keyof Messages> = {
  loaded_language: "ni_loaded_language",
  asymmetric_attribution: "ni_asymmetric_attribution",
  false_equivalence: "ni_false_equivalence",
  selective_omission: "ni_selective_omission",
  source_asymmetry: "ni_source_asymmetry",
  both_sidesing: "ni_both_sidesing",
  steering: "ni_steering",
  genetic_framing: "ni_genetic_framing",
};

const VERDICT_LABEL: Record<NeutralityVerdictValue, keyof Messages> = {
  neutral: "nv_neutral",
  partisan_lean: "nv_partisan_lean",
  explicitly_partisan: "nv_explicitly_partisan",
  manipulation: "nv_manipulation",
};

export function LiveNeutralityList({
  findings,
  verdict,
  showLensBadge = false,
}: Props) {
  const { t } = useI18n();
  if (findings.length === 0 && !verdict) {
    return (
      <div className="text-sm italic text-muted">
        {t.live_no_neutrality_yet}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {verdict ? (
        <div className="rounded-md border border-accent/40 bg-accent/10 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {showLensBadge ? (
                <LiveResultTypeBadge lens="neutrality" />
              ) : null}
              <span className="text-xs uppercase tracking-wide text-muted">
                {t.live_partial_verdict}
              </span>
            </div>
            <span className="text-sm font-medium">
              {t[VERDICT_LABEL[verdict.verdict]] as string}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            {t.live_confidence}: {Math.round(verdict.confidence * 100)}%
          </p>
          {verdict.rationale ? (
            <p className="mt-2 text-sm">{verdict.rationale}</p>
          ) : null}
        </div>
      ) : null}

      <ul className="space-y-2">
        {findings.map((finding, index) => (
          <li
            key={`${finding.sentenceIds.join("-")}-${finding.issue}-${index}`}
            className="rounded-md border border-rule bg-paper p-3"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {showLensBadge ? (
                  <LiveResultTypeBadge lens="neutrality" />
                ) : null}
                <span className="rounded border border-purple-500/40 px-2 py-0.5 text-xs text-purple-500">
                  {t[ISSUE_LABEL[finding.issue]] as string}
                </span>
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
        ))}
      </ul>
    </div>
  );
}
