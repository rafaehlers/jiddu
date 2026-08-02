"use client";

import { useEffect } from "react";
import { formatAppDateTime } from "@/lib/date-time";
import { useI18n } from "@/lib/i18n/provider";
import type { Messages } from "@/lib/i18n/messages";
import type { Lang } from "@/lib/fallacies";
import type { Block } from "@/lib/paragraphs";
import { getExplainableFindings } from "@/lib/explain-sections";
import type {
  ExplainFinding,
  ExplainLevel,
  PaperMap,
  PaperMapStatement,
} from "@/lib/explain-schema";

type Props = {
  id: string;
  title: string | null;
  sourceRef: string | null;
  source: string;
  text: string;
  blocks: Block[];
  findings: ExplainFinding[];
  overview: string;
  paperMap: PaperMap | null;
  level: ExplainLevel;
  model: string;
  createdAt: Date;
  reviewedAt: Date | null;
};

// Print views read the user's locale via I18nProvider — print pages share
// the root layout with the rest of the app, so the language selection flows
// through unchanged.
export function ExplainPrintView({
  id,
  title,
  sourceRef,
  source,
  text,
  blocks,
  findings,
  overview,
  paperMap,
  level,
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

  // Cards in document order (by the first block each covers).
  const blockPos = new Map(blocks.map((b, i) => [b.id, i]));
  const sectionByBlock = new Map(
    blocks.filter((b) => b.section).map((b) => [b.id, b.section as string]),
  );
  const ordered = getExplainableFindings(findings, blocks).sort((a, b) => {
    const pa = Math.min(
      ...a.blockIds.map((bid) => blockPos.get(bid) ?? Number.POSITIVE_INFINITY),
    );
    const pb = Math.min(
      ...b.blockIds.map((bid) => blockPos.get(bid) ?? Number.POSITIVE_INFINITY),
    );
    return pa - pb;
  });
  const paperMapRows = paperMap
    ? [
        { label: t.explain_map_question, statement: paperMap.researchQuestion },
        { label: t.explain_map_contribution, statement: paperMap.contribution },
        { label: t.explain_map_approach, statement: paperMap.approach },
        { label: t.explain_map_answer, statement: paperMap.mainAnswer },
        { label: t.explain_map_evidence, statement: paperMap.evidence },
        { label: t.explain_map_limitation, statement: paperMap.statedLimitation },
      ].filter(
        (row): row is { label: string; statement: PaperMapStatement } =>
          row.statement !== null,
      )
    : [];
  const hasPaperMap =
    paperMap !== null &&
    (paperMap.paperTypes.length > 0 ||
      paperMap.contributionTypes.length > 0 ||
      paperMapRows.length > 0);
  const quickScanRows = paperMap?.quickScan
    ? [
        { label: t.explain_map_paper_type, statement: paperMap.quickScan.category },
        { label: t.explain_quick_context, statement: paperMap.quickScan.context },
        {
          label: t.explain_quick_correctness,
          statement: paperMap.quickScan.apparentCorrectness,
        },
        {
          label: t.explain_map_contribution_type,
          statement: paperMap.quickScan.contributions,
        },
        { label: t.explain_quick_clarity, statement: paperMap.quickScan.clarity },
      ].filter(
        (row): row is { label: string; statement: PaperMapStatement } =>
          row.statement !== null,
      )
    : [];
  const evidenceChainRows = paperMap?.evidenceChain
    ? [
        {
          label: t.explain_chain_big_question,
          statement: paperMap.evidenceChain.bigQuestion,
        },
        {
          label: t.explain_map_question,
          statement: paperMap.evidenceChain.specificQuestion,
        },
        { label: t.role_method, statement: paperMap.evidenceChain.method },
        { label: t.role_result, statement: paperMap.evidenceChain.result },
        {
          label: t.role_interpretation,
          statement: paperMap.evidenceChain.interpretation,
        },
        { label: t.role_conclusion, statement: paperMap.evidenceChain.conclusion },
      ].filter(
        (row): row is { label: string; statement: PaperMapStatement } =>
          row.statement !== null,
      )
    : [];
  const challenge = paperMap?.challenge ?? null;

  return (
    <div className="print-root">
      <style>{PRINT_CSS}</style>

      <header className="print-header">
        <div className="print-brand">
          <span className="print-brand-name">Jiddu</span>
          <span className="print-brand-tag">truth is a pathless land</span>
        </div>
        <h1>{title ?? t.fc_untitled}</h1>
        <div className="print-level-pill">
          <span className="print-level-label">
            {(t[`level_${level}` as keyof Messages] as string).toUpperCase()}
          </span>
        </div>
        {overview && <p className="print-summary">{overview}</p>}
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
          <dd>{t.print_type_explain}</dd>
          <dt>{t.print_meta_level}</dt>
          <dd>{t[`level_${level}` as keyof Messages] as string}</dd>
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
          <dd>https://jiddu.app/e/{id}</dd>
        </dl>
      </header>

      {quickScanRows.length > 0 && (
        <section className="print-section print-paper-map">
          <h2>{t.explain_quick_label}</h2>
          <dl className="print-map-grid">
            {quickScanRows.map(({ label, statement }) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{statement.text}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {hasPaperMap && paperMap && (
        <section className="print-section print-paper-map">
          <h2>{t.explain_map_label}</h2>
          <div className="print-map-tags">
            {paperMap.paperTypes.length > 0 && (
              <p>
                <strong>{t.explain_map_paper_type}:</strong>{" "}
                {paperMap.paperTypes.join(" · ")}
              </p>
            )}
            {paperMap.contributionTypes.length > 0 && (
              <p>
                <strong>{t.explain_map_contribution_type}:</strong>{" "}
                {paperMap.contributionTypes.join(" · ")}
              </p>
            )}
          </div>
          {paperMapRows.length > 0 && (
            <dl className="print-map-grid">
              {paperMapRows.map(({ label, statement }) => {
                return (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{statement.text}</dd>
                  </div>
                );
              })}
            </dl>
          )}
        </section>
      )}

      {evidenceChainRows.length > 0 && (
        <section className="print-section print-paper-map">
          <h2>{t.explain_chain_label}</h2>
          <dl className="print-map-grid">
            {evidenceChainRows.map(({ label, statement }, index) => (
              <div key={`${label}-${index}`}>
                <dt>{index + 1}. {label}</dt>
                <dd>{statement.text}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {paperMap?.notebook &&
        (paperMap.notebook.keyTerms.length > 0 ||
          paperMap.notebook.questionsForAuthors.length > 0 ||
          paperMap.notebook.confusingPassages.length > 0 ||
          paperMap.notebook.implicitAssumptions.length > 0 ||
          paperMap.notebook.furtherReading.length > 0) && (
          <section className="print-section">
            <h2>{t.explain_notebook_label}</h2>
            {paperMap.notebook.keyTerms.length > 0 && (
              <>
                <h3>{t.explain_notebook_terms}</h3>
                <ul>
                  {paperMap.notebook.keyTerms.map((term) => (
                    <li key={term.term}>
                      <strong>{term.term}:</strong> {term.meaning}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {[
              [t.explain_notebook_questions, paperMap.notebook.questionsForAuthors],
              [t.explain_notebook_confusing, paperMap.notebook.confusingPassages],
              [t.explain_notebook_assumptions, paperMap.notebook.implicitAssumptions],
              [t.explain_notebook_further, paperMap.notebook.furtherReading],
            ].map(([label, statements]) =>
              typeof label === "string" && Array.isArray(statements) && statements.length > 0 ? (
                <div key={label}>
                  <h3>{label}</h3>
                  <ul>
                    {statements.map((statement, index) => (
                      <li key={index}>{statement.text}</li>
                    ))}
                  </ul>
                </div>
              ) : null,
            )}
          </section>
        )}

      {challenge && (
        <section className="print-section print-paper-map">
          <h2>{t.explain_challenge_label}</h2>
          <dl className="print-map-grid">
            {[
              [t.explain_challenge_independent, challenge.independentInterpretation],
              [t.explain_challenge_authors, challenge.authorsInterpretation],
              [t.explain_challenge_comparison, challenge.comparison],
            ].map(([label, statement]) =>
              typeof label === "string" && statement && typeof statement === "object" && "text" in statement ? (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{statement.text}</dd>
                </div>
              ) : null,
            )}
            {challenge.abstractFidelity && (
              <div>
                <dt>{t.explain_challenge_fidelity}</dt>
                <dd>{challenge.abstractFidelity.explanation}</dd>
              </div>
            )}
          </dl>
          {challenge.visualAudit.length > 0 && (
            <>
              <h3>{t.explain_challenge_visual}</h3>
              <ul>
                {challenge.visualAudit.map((item, index) => (
                  <li key={`${item.pageNumber}-${index}`}>
                    <strong>{item.label} · {t.explain_page} {item.pageNumber}:</strong>{" "}
                    {item.assessment}{item.concern ? ` — ${item.concern}` : ""}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <section className="print-section print-source-text">
        <h2>{t.print_section_source_text}</h2>
        <p>{text}</p>
      </section>

      <section className="print-section">
        <h2>
          {t.print_section_explanations} ({ordered.length})
        </h2>
        {ordered.length === 0 ? (
          <p className="print-muted">{t.print_no_explanations}</p>
        ) : (
          <ol className="print-findings">
            {ordered.map((f, i) => {
              const section = f.blockIds
                .map((bid) => sectionByBlock.get(bid))
                .find(Boolean);
              return (
                <li key={i} className="print-finding">
                  <div className="print-finding-head">
                    <span className="print-finding-idx">#{i + 1}</span>
                    {section && <span className="print-section-name">{section}</span>}
                    <span className="print-issue-name">
                      {t[`role_${f.role}` as keyof Messages] as string}
                    </span>
                  </div>
                  <p className="print-explanation">{f.explanation}</p>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <footer className="print-footer">
        <p>{t.print_footer_explain}</p>
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
  .print-brand-name { font-size: 22px; font-weight: 600; }
  .print-brand-tag { font-style: italic; color: #555; font-size: 12px; }
  .print-root h1 { font-size: 26px; margin: 0 0 12px; line-height: 1.25; }
  .print-root h2 {
    font-size: 16px;
    margin: 24px 0 8px;
    font-family: ui-sans-serif, system-ui, sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #444;
  }
  .print-level-pill {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    padding: 6px 12px;
    border: 1px solid #4338ca;
    color: #4338ca;
    border-radius: 6px;
    font-family: ui-sans-serif, system-ui, sans-serif;
    margin-bottom: 8px;
  }
  .print-level-label { font-weight: 700; font-size: 14px; letter-spacing: 0.05em; }
  .print-summary { font-size: 14px; margin: 8px 0 16px; font-style: italic; color: #333; }
  .print-map-tags { font-family: ui-sans-serif, system-ui, sans-serif; font-size: 11px; color: #444; }
  .print-map-tags p { margin: 3px 0; }
  .print-map-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-top: 1px solid #bbb;
    border-left: 1px solid #bbb;
    margin: 10px 0 0;
  }
  .print-map-grid > div { border-right: 1px solid #bbb; border-bottom: 1px solid #bbb; padding: 9px; }
  .print-map-grid dt {
    font: 600 9px/1.3 ui-sans-serif, system-ui, sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #555;
    margin-bottom: 3px;
  }
  .print-map-grid dd { margin: 0; font-size: 12px; }
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
  .print-meta dt { text-transform: uppercase; letter-spacing: 0.05em; color: #888; }
  .print-meta dd { margin: 0; }
  .print-source-text p { font-size: 14px; text-align: justify; margin: 0; white-space: pre-wrap; }
  .print-findings { padding: 0; margin: 0; list-style: none; }
  .print-finding { border-top: 1px solid #ddd; padding: 14px 0; page-break-inside: avoid; }
  .print-finding-head {
    display: flex;
    gap: 8px;
    align-items: center;
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-size: 11px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }
  .print-finding-idx { color: #888; font-family: ui-monospace, monospace; }
  .print-section-name { color: #1f2937; font-weight: 600; }
  .print-issue-name { color: #444; font-style: italic; text-transform: uppercase; letter-spacing: 0.04em; }
  .print-explanation { font-size: 13px; margin: 0; }
  .print-muted { color: #666; }
  .print-footer {
    margin-top: 32px;
    padding-top: 12px;
    border-top: 1px solid #ddd;
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-size: 10px;
    color: #555;
  }
`;
