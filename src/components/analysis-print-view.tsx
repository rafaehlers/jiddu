"use client";

import { useEffect } from "react";
import { formatAppDateTime } from "@/lib/date-time";
import { useI18n } from "@/lib/i18n/provider";
import type { Messages } from "@/lib/i18n/messages";
import type { Finding, Sentence } from "@/lib/schema";
import { FALLACY_BY_ID, type Lang } from "@/lib/fallacies";
import type { Block } from "@/lib/paragraphs";
import { StructuredDocumentText } from "@/components/structured-document-text";

type Props = {
  id: string;
  title: string | null;
  sourceRef: string | null;
  source: string;
  text: string;
  blocks: Block[];
  sentences: Sentence[];
  findings: Finding[];
  score: number;
  summary: string;
  model: string;
  createdAt: Date;
  reviewedAt: Date | null;
};

function scoreLabel(s: number, t: Messages): string {
  if (s >= 81) return t.score_propagandistic;
  if (s >= 61) return t.score_high;
  if (s >= 36) return t.score_several;
  if (s >= 16) return t.score_minor;
  return t.score_clean;
}

// Print-optimized view of a fallacy analysis. Same approach as the
// fact-check version: auto-print on mount, plain HTML + @media print rules.
export function AnalysisPrintView({
  id,
  title,
  sourceRef,
  source,
  text,
  blocks,
  sentences,
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
    const t = setTimeout(() => window.print(), 250);
    return () => clearTimeout(t);
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
          <dd>{t.print_type_fallacy}</dd>
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
          <dd>https://jiddu.app/a/{id}</dd>
        </dl>
      </header>

      <section className="print-section print-source-text">
        <h2>{t.print_section_source_text}</h2>
        <StructuredDocumentText
          text={text}
          blocks={blocks}
          sentences={sentences}
          renderSentence={(sentence) => <span>{sentence.text}</span>}
          variant="print"
        />
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
              const meta = FALLACY_BY_ID[f.fallacy];
              // Fallacy names live in the catalog, keyed by lang. Fall back
              // to EN when the chosen lang doesn't have a localized name.
              const fallacyName = meta?.name[lang] ?? meta?.name.en ?? f.fallacy;
              return (
                <li key={i} className="print-finding">
                  <div className="print-finding-head">
                    <span className="print-finding-idx">#{i + 1}</span>
                    <span
                      className={`print-sev print-sev-${f.severity}`}
                    >
                      {(t[`severity_${f.severity}` as keyof Messages] as string).toUpperCase()}
                    </span>
                    <span className="print-fallacy-name">{fallacyName}</span>
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
        <p>{t.print_footer_fallacy}</p>
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

// Shared with the slop print view (same layout, different catalog/labels).
export const PRINT_CSS = `
  .print-root {
    font-family: Georgia, "Times New Roman", serif;
    color: #111;
    background: #fff;
    max-width: 720px;
    margin: 0 auto;
    padding: 32px 24px 48px;
    line-height: 1.5;
  }
  .print-root a {
    color: #1a4ed8;
    word-break: break-all;
  }
  .print-brand {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 12px;
  }
  .print-brand-name {
    font-size: 22px;
    font-weight: 600;
  }
  .print-brand-tag {
    font-style: italic;
    color: #555;
    font-size: 12px;
  }
  .print-root h1 {
    font-size: 26px;
    margin: 0 0 12px;
    line-height: 1.25;
  }
  .print-root h2 {
    font-size: 16px;
    margin: 24px 0 8px;
    font-family: ui-sans-serif, system-ui, sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #444;
  }
  .print-score {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    background: #fafafa;
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 6px 12px;
    font-family: ui-sans-serif, system-ui, sans-serif;
    margin-bottom: 12px;
  }
  .print-score-num {
    font-size: 22px;
    font-weight: 700;
    font-family: ui-monospace, monospace;
  }
  .print-score-label {
    font-size: 12px;
    color: #555;
  }
  .print-summary {
    font-size: 14px;
    margin: 0 0 16px;
    font-style: italic;
    color: #333;
  }
  .print-meta {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 4px 12px;
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-size: 11px;
    color: #444;
    border-top: 1px solid #ddd;
    border-bottom: 1px solid #ddd;
    padding: 12px 0;
    margin: 0;
  }
  .print-meta dt {
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #888;
  }
  .print-meta dd {
    margin: 0;
  }
  .print-source-text p {
    font-size: 14px;
    text-align: justify;
  }
  .print-document-paragraph {
    margin: 0 0 10px;
  }
  .print-document-heading,
  .print-document-references h3 {
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #555;
    margin: 18px 0 8px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 4px;
  }
  .print-findings {
    padding: 0;
    margin: 0;
    list-style: none;
  }
  .print-finding {
    border-top: 1px solid #ddd;
    padding: 14px 0;
    page-break-inside: avoid;
  }
  .print-finding-head {
    display: flex;
    gap: 8px;
    align-items: center;
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-size: 11px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }
  .print-finding-idx {
    color: #888;
    font-family: ui-monospace, monospace;
  }
  .print-sev {
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid #999;
    font-weight: 600;
    letter-spacing: 0.05em;
  }
  .print-sev-high {
    border-color: #b91c1c;
    color: #b91c1c;
  }
  .print-sev-low {
    border-color: #b45309;
    color: #b45309;
  }
  .print-fallacy-name {
    color: #444;
    font-style: italic;
  }
  .print-quote {
    margin: 0 0 6px;
    padding: 6px 12px;
    border-left: 3px solid #ddd;
    font-style: italic;
    color: #333;
    font-size: 13px;
  }
  .print-explanation {
    font-size: 13px;
    margin: 0;
  }
  .print-muted {
    color: #666;
  }
  .print-footer {
    margin-top: 32px;
    padding-top: 12px;
    border-top: 1px solid #ddd;
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-size: 10px;
    color: #555;
  }
  @media screen {
    body {
      background: #f3f3f3;
    }
    .print-root {
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
      margin-top: 24px;
      margin-bottom: 24px;
    }
  }
  @media print {
    body {
      background: #fff;
    }
    .print-root {
      box-shadow: none;
      margin: 0;
      padding: 0 12px;
      max-width: none;
    }
    @page {
      margin: 18mm 14mm;
    }
  }
`;
