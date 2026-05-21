"use client";

import { useEffect } from "react";
import type { Sentence } from "@/lib/schema";
import type { Claim, ClaimType } from "@/lib/claims-schema";
import type { Verdict, VerdictValue } from "@/lib/verdict-schema";

type ClaimWithId = Claim & { id: string };

type Props = {
  id: string;
  title: string | null;
  sourceRef: string | null;
  source: string;
  text: string;
  sentences: Sentence[];
  claims: ClaimWithId[];
  verdicts: Verdict[];
  verifyModel: string | null;
  model: string;
  createdAt: Date;
  reviewedAt: Date | null;
};

const TYPE_LABEL: Record<ClaimType, string> = {
  numeric: "Numeric",
  date: "Date",
  quote: "Quote",
  causal: "Causal",
  categorical: "Categorical",
};

const VERDICT_LABEL: Record<VerdictValue, string> = {
  supported: "SUPPORTED",
  contradicted: "CONTRADICTED",
  mixed: "MIXED",
  unverified: "UNVERIFIED",
};

// Print-optimized view of a fact-check. Loaded in a new tab; the layout
// is plain HTML with @media print rules. We auto-trigger the print dialog
// on mount so the user only sees the report briefly before the "Save as
// PDF" sheet pops up.
export function FactCheckPrintView({
  id,
  title,
  sourceRef,
  source,
  text,
  sentences: _sentences,
  claims,
  verdicts,
  verifyModel,
  model,
  createdAt,
  reviewedAt,
}: Props) {
  const verdictById = new Map(verdicts.map((v) => [v.claimId, v]));

  useEffect(() => {
    // Skip auto-print when the URL has ?nopr=1 — handy for QA / screenshots.
    if (typeof window !== "undefined" && window.location.search.includes("nopr")) {
      return;
    }
    // Delay one frame so the page paints first.
    const t = setTimeout(() => {
      window.print();
    }, 250);
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
          <dd>Fact-check</dd>
          <dt>Generated</dt>
          <dd>{fmt(createdAt)}</dd>
          {reviewedAt && (
            <>
              <dt>Human-reviewed</dt>
              <dd>{fmt(reviewedAt)}</dd>
            </>
          )}
          <dt>Claim extraction</dt>
          <dd>{model}</dd>
          {verifyModel && (
            <>
              <dt>Verdict model</dt>
              <dd>{verifyModel}</dd>
            </>
          )}
          <dt>Report URL</dt>
          <dd>https://jiddu.app/f/{id}</dd>
        </dl>
      </header>

      <section className="print-section print-source-text">
        <h2>Source text</h2>
        <p>{text}</p>
      </section>

      <section className="print-section">
        <h2>
          Claims ({claims.length}
          {verdicts.length > 0 ? ` · ${verdicts.length} verdicts` : ""})
        </h2>
        {claims.length === 0 ? (
          <p className="print-muted">No verifiable claims extracted.</p>
        ) : (
          <ol className="print-claims">
            {claims.map((c, i) => {
              const v = verdictById.get(c.id) ?? null;
              return (
                <li key={c.id} className="print-claim">
                  <div className="print-claim-head">
                    <span className="print-claim-idx">#{i + 1}</span>
                    {v && (
                      <span className={`print-verdict print-verdict-${v.verdict}`}>
                        {VERDICT_LABEL[v.verdict]}
                        <span className="print-conf">
                          {Math.round(v.confidence * 100)}%
                        </span>
                      </span>
                    )}
                    <span className="print-type">{TYPE_LABEL[c.type]}</span>
                  </div>
                  <p className="print-statement">{c.statement}</p>
                  {v ? (
                    <p className="print-rationale">{v.rationale}</p>
                  ) : (
                    <p className="print-rationale print-muted">
                      No verdict yet. Extraction rationale: {c.rationale}
                    </p>
                  )}
                  {v && v.sources.length > 0 && (
                    <ul className="print-sources">
                      {v.sources.map((s, j) => (
                        <li key={j}>
                          <a href={s.url}>{s.title ?? s.url}</a>
                          <span className="print-source-url">{s.url}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <footer className="print-footer">
        <p>
          This is an automated report. The verdicts may be wrong — always
          read the cited sources and judge for yourself. See
          https://jiddu.app/legal for the full terms.
        </p>
        <p className="print-muted">
          Generated {fmt(new Date())} · jiddu.app
        </p>
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
  /* Reset for print: force a light, paper-like canvas regardless of the
     user's dark-mode preference. Print stylesheets in Chrome/Safari ignore
     CSS variables tied to color-scheme, so we use plain colors here. */
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
    margin: 0 0 16px;
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
  .print-claims {
    padding: 0;
    margin: 0;
    list-style: none;
  }
  .print-claim {
    border-top: 1px solid #ddd;
    padding: 14px 0;
    page-break-inside: avoid;
  }
  .print-claim-head {
    display: flex;
    gap: 8px;
    align-items: center;
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-size: 11px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }
  .print-claim-idx {
    color: #888;
    font-family: ui-monospace, monospace;
  }
  .print-verdict {
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid #999;
    font-weight: 600;
    letter-spacing: 0.05em;
    display: inline-flex;
    gap: 6px;
    align-items: center;
  }
  .print-verdict-supported {
    border-color: #0c8a4d;
    color: #0c8a4d;
  }
  .print-verdict-contradicted {
    border-color: #b91c1c;
    color: #b91c1c;
  }
  .print-verdict-mixed {
    border-color: #b45309;
    color: #b45309;
  }
  .print-verdict-unverified {
    border-color: #888;
    color: #555;
  }
  .print-conf {
    opacity: 0.7;
    font-weight: 400;
  }
  .print-type {
    color: #555;
    margin-left: auto;
  }
  .print-statement {
    font-size: 15px;
    font-weight: 600;
    margin: 0 0 6px;
  }
  .print-rationale {
    font-size: 13px;
    margin: 0 0 8px;
    color: #222;
  }
  .print-muted {
    color: #666;
  }
  .print-sources {
    font-family: ui-sans-serif, system-ui, sans-serif;
    list-style: none;
    padding: 0;
    margin: 4px 0 0;
    font-size: 11px;
  }
  .print-sources li {
    padding: 2px 0;
    page-break-inside: avoid;
  }
  .print-source-url {
    display: block;
    color: #777;
    font-size: 10px;
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
