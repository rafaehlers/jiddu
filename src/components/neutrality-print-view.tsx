"use client";

import { useEffect } from "react";
import { formatAppDateTime } from "@/lib/date-time";
import { useI18n } from "@/lib/i18n/provider";
import type { Messages } from "@/lib/i18n/messages";
import type { Lang } from "@/lib/fallacies";
import type { Sentence } from "@/lib/schema";
import type {
  NeutralityFinding,
  NeutralityIssue,
  NeutralityVerdictValue,
  TextType,
} from "@/lib/neutrality-schema";

type Props = {
  id: string;
  title: string | null;
  sourceRef: string | null;
  source: string;
  text: string;
  sentences: Sentence[];
  findings: NeutralityFinding[];
  verdict: NeutralityVerdictValue;
  confidence: number;
  rationale: string;
  textType: TextType;
  model: string;
  createdAt: Date;
  reviewedAt: Date | null;
};

// Print views read the user's locale via I18nProvider — print pages
// share the root layout with the rest of the app, so localStorage-driven
// language selection flows through unchanged.
export function NeutralityPrintView({
  id,
  title,
  sourceRef,
  source,
  text,
  findings,
  verdict,
  confidence,
  rationale,
  textType,
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
        <div className={`print-verdict-pill print-verdict-${verdict}`}>
          <span className="print-verdict-label">
            {(t[`nv_${verdict}` as keyof Messages] as string).toUpperCase()}
          </span>
          <span className="print-conf">{Math.round(confidence * 100)}%</span>
        </div>
        {rationale && <p className="print-summary">{rationale}</p>}
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
          <dd>{t.print_type_neutrality}</dd>
          <dt>{t.print_meta_text_type}</dt>
          <dd>{t[`tt_${textType}` as keyof Messages] as string}</dd>
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
          <dd>https://jiddu.app/n/{id}</dd>
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
            {findings.map((f, i) => (
              <li key={i} className="print-finding">
                <div className="print-finding-head">
                  <span className="print-finding-idx">#{i + 1}</span>
                  <span className={`print-sev print-sev-${f.severity}`}>
                    {(t[`severity_${f.severity}` as keyof Messages] as string).toUpperCase()}
                  </span>
                  <span className="print-issue-name">
                    {t[`ni_${f.issue as NeutralityIssue}` as keyof Messages] as string}
                  </span>
                </div>
                <blockquote className="print-quote">
                  &ldquo;{f.quote}&rdquo;
                </blockquote>
                <p className="print-explanation">{f.explanation}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <footer className="print-footer">
        <p>{t.print_footer_neutrality}</p>
        <p className="print-muted">{t.print_generated_at(fmt(new Date(), lang))}</p>
      </footer>
    </div>
  );
}

// Locale-aware date format. Falls back to en-US if lang is somehow unset.
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

const PRINT_CSS = `
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
  .print-verdict-pill {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    padding: 6px 12px;
    border: 1px solid #999;
    border-radius: 6px;
    font-family: ui-sans-serif, system-ui, sans-serif;
    margin-bottom: 8px;
  }
  .print-verdict-pill.print-verdict-neutral { border-color: #0c8a4d; color: #0c8a4d; }
  .print-verdict-pill.print-verdict-partisan_lean { border-color: #b45309; color: #b45309; }
  .print-verdict-pill.print-verdict-explicitly_partisan { border-color: #c2410c; color: #c2410c; }
  .print-verdict-pill.print-verdict-manipulation { border-color: #b91c1c; color: #b91c1c; }
  .print-verdict-label {
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 0.05em;
  }
  .print-conf {
    font-family: ui-monospace, monospace;
    font-size: 12px;
    opacity: 0.7;
  }
  .print-summary {
    font-size: 14px;
    margin: 8px 0 16px;
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
    margin: 0;
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
  .print-issue-name {
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
