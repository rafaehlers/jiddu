"use client";

import { UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { FallacyFilterBar } from "@/components/fallacy-filter-bar";
import {
  ALL_FALLACIES_FILTER,
  fallacyCounts,
  fallacyFiltersWithFindings,
  fallacyFindingMatchesFilter,
} from "@/lib/fallacy-filter";
import { FALLACY_BY_ID } from "@/lib/fallacies";
import { useI18n } from "@/lib/i18n/provider";
import type { Finding } from "@/lib/schema";
import { LiveResultTypeBadge } from "./result-type-badge";

type Props = {
  findings: Finding[];
  lang: "en" | "pt" | "es";
  showLensBadge?: boolean;
  showFallacyFilter?: boolean;
};

export function FindingsList({
  findings,
  lang,
  showLensBadge = false,
  showFallacyFilter = false,
}: Props) {
  const { t } = useI18n();
  const [fallacyFilter, setFallacyFilter] = useState(ALL_FALLACIES_FILTER);
  const counts = useMemo(() => fallacyCounts(findings), [findings]);
  const filters = useMemo(
    () => fallacyFiltersWithFindings(counts),
    [counts],
  );
  const activeFilter =
    fallacyFilter === ALL_FALLACIES_FILTER || (counts[fallacyFilter] ?? 0) > 0
      ? fallacyFilter
      : ALL_FALLACIES_FILTER;
  const visibleFindings = useMemo(
    () =>
      findings.filter((finding) =>
        fallacyFindingMatchesFilter(finding, activeFilter),
      ),
    [activeFilter, findings],
  );
  if (findings.length === 0) {
    return (
      <div className="text-sm text-muted italic">{t.live_no_findings_yet}</div>
    );
  }

  return (
    <div className="space-y-2">
      {showFallacyFilter ? (
        <FallacyFilterBar
          value={activeFilter}
          filters={filters}
          counts={counts}
          lang={lang}
          onChange={setFallacyFilter}
          className="pb-1"
        />
      ) : null}
      <ul className="space-y-2">
        {visibleFindings.map((f, idx) => {
          const def = FALLACY_BY_ID[f.fallacy];
          const name = def?.name[lang] ?? f.fallacy;
          const color = def?.color ?? "currentColor";
          return (
            <li
              key={`${f.sentenceIds.join("-")}-${f.fallacy}-${idx}`}
              className="rounded-md border border-rule bg-paper p-3"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {showLensBadge ? (
                    <LiveResultTypeBadge lens="fallacy" />
                  ) : null}
                  <span
                    className="rounded px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `color-mix(in oklab, ${color} 22%, transparent)`,
                      color: "var(--foreground)",
                    }}
                  >
                    {name}
                  </span>
                  {f.speakerName ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/35 bg-sky-500/5 px-2 py-0.5 text-xs text-sky-500">
                      <UserRound className="size-3" />
                      {f.speakerName}
                    </span>
                  ) : null}
                </div>
                <span
                  className={
                    "text-xs uppercase tracking-wider " +
                    (f.severity === "high"
                      ? "text-severity-high"
                      : "text-severity-low")
                  }
                >
                  {f.severity === "high" ? t.severity_high : t.severity_low}
                </span>
              </div>
              <blockquote className="mb-1 border-l-2 border-rule pl-2 text-sm italic text-muted">
                “{f.quote}”
              </blockquote>
              <p className="text-sm">{f.explanation}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
