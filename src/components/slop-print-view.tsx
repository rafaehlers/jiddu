"use client";

import { useEffect } from "react";
import { formatAppDateTime } from "@/lib/date-time";
import { useI18n } from "@/lib/i18n/provider";
import type { Messages } from "@/lib/i18n/messages";
import type { SlopFinding } from "@/lib/slop-schema";
import type { Sentence } from "@/lib/schema";
import { SLOP_BY_ID } from "@/lib/slop";
import type { Lang } from "@/lib/fallacies";
import { PRINT_CSS } from "@/components/analysis-print-view";

type Props = {
  id: string;
  title: string | null;
  sourceRef: string | null;
  source: string;
  text: string;
  sentences: Sentence[];
  findings: SlopFinding[];
  score: number;
  summary: string;
  model: string;
  createdAt: Date;
  reviewedAt: Date | null;
};

function scoreLabel(s: number, t: Messages): string {
  if (s >= 81) return t.slop_score_assembly;
  if (s >= 61) return t.slop_score_heavy;
  if (s >= 36) return t.slop_score_several;
  if (s >= 16) return t.slop_score_light;
  return t.slop_score_clean;
}

// Print-optimized view of a slop check — same recipe as AnalysisPrintView
// (auto-print on mount, plain HTML + the shared @media print CSS) with the
// slop catalog driving pattern names and the slop score bands.
export function SlopPrintView({
  id,
  title,
  sourceRef,
  source,
  text,
  findings,
  score,
  summary,
  model,
  createdAt,
  reviewedAt,
}: Props) {
  const { t, lang } = useI18n();
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("nopr")) {
      return;
    }
    const timer = setTimeout(() => window.print(), 250);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="print-root">
      <style>{PRINT_CSS}</style>

      <header className="print-header">
        <div className="print-brand">
          <span className="print-brand-name">Jiddu</span>
          <span className="print-brand-tag">truth is a pathless land</span>
        </div>
        <h1>{title ?? t.fc_untitled}</h1>
        <div className="print-score">
          <span className="print-score-num">{score}</span>
          <span className="print-score-label">/100 · {scoreLabel(score, t)}</span>
        </div>
        {summary && <p className="print-summary">{summary}</p>}
        <dl className="print-meta">
          {sourceRef && source === "url" && (
            <>
              <dt>{t.print_meta_source}</dt>
              <dd>
                <a href={sourceRef}>{sourceRef}</a>
              </dd>
            </>
          )}
          <dt>{t.print_meta_type}</dt>
          <dd>{t.print_type_slop}</dd>
          <dt>{t.print_meta_generated}</dt>
          <dd>{fmt(createdAt, lang)}</dd>
          {reviewedAt && (
            <>
              <dt>{t.print_meta_reviewed}</dt>
              <dd>{fmt(reviewedAt, lang)}</dd>
            </>
          )}
          <dt>{t.print_meta_model}</dt>
          <dd>{model}</dd>
          <dt>{t.print_meta_url}</dt>
          <dd>https://jiddu.app/s/{id}</dd>
        </dl>
      </header>

      <section className="print-section print-source-text">
        <h2>{t.print_section_source_text}</h2>
        <p>{text}</p>
      </section>

      <section className="print-section">
        <h2>
          {t.print_section_findings} ({findings.length})
        </h2>
        {findings.length === 0 ? (
          <p className="print-muted">{t.print_no_findings}</p>
        ) : (
          <ol className="print-findings">
            {findings.map((f, i) => {
              const meta = SLOP_BY_ID[f.pattern];
              const patternName = meta?.name[lang] ?? meta?.name.en ?? f.pattern;
              return (
                <li key={i} className="print-finding">
                  <div className="print-finding-head">
                    <span className="print-finding-idx">#{i + 1}</span>
                    <span className={`print-sev print-sev-${f.severity}`}>
                      {(t[`severity_${f.severity}` as keyof Messages] as string).toUpperCase()}
                    </span>
                    <span className="print-fallacy-name">{patternName}</span>
                  </div>
                  <blockquote className="print-quote">
                    &ldquo;{f.quote}&rdquo;
                  </blockquote>
                  <p className="print-explanation">{f.explanation}</p>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <footer className="print-footer">
        <p>{t.print_footer_slop}</p>
        <p className="print-muted">{t.print_generated_at(fmt(new Date(), lang))}</p>
      </footer>
    </div>
  );
}

function fmt(d: Date, lang: Lang): string {
  const locale = lang === "pt" ? "pt-BR" : lang === "es" ? "es-ES" : "en-US";
  return formatAppDateTime(d, locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
