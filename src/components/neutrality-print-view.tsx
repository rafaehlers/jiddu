"use client";

import { useEffect } from "react";
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

const ISSUE_LABEL: Record<NeutralityIssue, string> = {
  loaded_language: "Loaded language",
  asymmetric_attribution: "Asymmetric attribution",
  false_equivalence: "False equivalence",
  selective_omission: "Selective omission",
  source_asymmetry: "Source asymmetry",
  both_sidesing: "Both-sidesing",
  steering: "Steering",
  genetic_framing: "Genetic framing",
};

const VERDICT_LABEL: Record<NeutralityVerdictValue, string> = {
  neutral: "NEUTRAL",
  partisan_lean: "PARTISAN LEAN",
  explicitly_partisan: "EXPLICITLY PARTISAN",
  manipulation: "MANIPULATION",
};

const TEXT_TYPE_LABEL: Record<TextType, string> = {
  informational: "Informational",
  opinion: "Opinion",
  political_speech: "Political speech",
  advocacy: "Advocacy",
  analysis: "Analysis",
  marketing: "Marketing",
  social_media: "Social media",
};

export function NeutralityPrintView({
  id,
  title,
  sourceRef,
  source,
  text,
  sentences: _sentences,
  findings,
  verdict,
  confidence,
  rationale,
  textType,
  model,
  createdAt,
  reviewedAt,
}: Props) {
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
        <h1>{title ?? "Untitled"}</h1>
        <div className={`print-verdict-pill print-verdict-${verdict}`}>
          <span className="print-verdict-label">{VERDICT_LABEL[verdict]}</span>
          <span className="print-conf">{Math.round(confidence * 100)}%</span>
        </div>
        {rationale && <p className="print-summary">{rationale}</p>}
        <dl className="print-meta">
          {sourceRef && source === "url" && (
            <>
              <dt>Source</dt>
              <dd>
                <a href={sourceRef}>{sourceRef}</a>
              </dd>
            </>
          )}
          <dt>Type</dt>
          <dd>Neutrality assessment</dd>
          <dt>Text type</dt>
          <dd>{TEXT_TYPE_LABEL[textType]}</dd>
          <dt>Generated</dt>
          <dd>{fmt(createdAt)}</dd>
          {reviewedAt && (
            <>
              <dt>Human-reviewed</dt>
              <dd>{fmt(reviewedAt)}</dd>
            </>
          )}
          <dt>Model</dt>
          <dd>{model}</dd>
          <dt>Report URL</dt>
          <dd>https://jiddu.app/n/{id}</dd>
        </dl>
      </header>

      <section className="print-section print-source-text">
        <h2>Source text</h2>
        <p>{text}</p>
      </section>

      <section className="print-section">
        <h2>Findings ({findings.length})</h2>
        {findings.length === 0 ? (
          <p className="print-muted">No neutrality issues flagged.</p>
        ) : (
          <ol className="print-findings">
            {findings.map((f, i) => (
              <li key={i} className="print-finding">
                <div className="print-finding-head">
                  <span className="print-finding-idx">#{i + 1}</span>
                  <span className={`print-sev print-sev-${f.severity}`}>
                    {f.severity.toUpperCase()}
                  </span>
                  <span className="print-issue-name">{ISSUE_LABEL[f.issue]}</span>
                </div>
                <blockquote className="print-quote">"{f.quote}"</blockquote>
                <p className="print-explanation">{f.explanation}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <footer className="print-footer">
        <p>
          This is an automated report. Neutrality is a property of framing;
          the labels may be wrong — read the source text and the flagged
          passages. Jiddu does not classify partisan direction. See
          https://jiddu.app/legal for the full terms.
        </p>
        <p className="print-muted">Generated {fmt(new Date())} · jiddu.app</p>
      </footer>
    </div>
  );
}

function fmt(d: Date): string {
  return d.toLocaleString("en-US", {
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
