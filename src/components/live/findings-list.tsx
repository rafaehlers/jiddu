"use client";

import { FALLACY_BY_ID } from "@/lib/fallacies";
import type { Finding } from "@/lib/schema";
import { useI18n } from "@/lib/i18n/provider";

type Props = {
  findings: Finding[];
  lang: "en" | "pt" | "es";
};

export function FindingsList({ findings, lang }: Props) {
  const { t } = useI18n();
  if (findings.length === 0) {
    return (
      <div className="text-sm text-muted italic">{t.live_no_findings_yet}</div>
    );
  }

  return (
    <ul className="space-y-2">
      {findings.map((f, idx) => {
        const def = FALLACY_BY_ID[f.fallacy];
        const name = def?.name[lang] ?? f.fallacy;
        const color = def?.color ?? "currentColor";
        return (
          <li
            key={`${f.sentenceIds.join("-")}-${f.fallacy}-${idx}`}
            className="rounded-md border border-rule bg-paper p-3"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded"
                style={{
                  backgroundColor: `color-mix(in oklab, ${color} 22%, transparent)`,
                  color: "var(--foreground)",
                }}
              >
                {name}
              </span>
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
            <blockquote className="text-sm italic text-muted border-l-2 border-rule pl-2 mb-1">
              “{f.quote}”
            </blockquote>
            <p className="text-sm">{f.explanation}</p>
          </li>
        );
      })}
    </ul>
  );
}
