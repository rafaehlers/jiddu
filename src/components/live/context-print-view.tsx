"use client";

import { useEffect } from "react";
import { PRINT_CSS } from "@/components/analysis-print-view";
import { formatAppDateTime } from "@/lib/date-time";
import type { Lang } from "@/lib/fallacies";
import { useI18n } from "@/lib/i18n/provider";
import type { LiveContext } from "@/lib/live-context-schema";

type Props = {
  id: string;
  title: string;
  transcript: string;
  context: LiveContext;
  model: string;
  createdAt: Date;
  audioDurationMs: number | null;
};

export function LiveContextPrintView({
  id,
  title,
  transcript,
  context,
  model,
  createdAt,
  audioDurationMs,
}: Props) {
  const { t, lang } = useI18n();
  const tags = context.tags ?? [];
  const relatedLinks = context.relatedLinks ?? [];

  useEffect(() => {
    if (window.location.search.includes("nopr")) return;
    const timer = window.setTimeout(() => window.print(), 250);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="print-root live-context-print">
      <style>{`${PRINT_CSS}\n${LIVE_CONTEXT_PRINT_CSS}`}</style>

      <header className="print-header">
        <div className="print-brand">
          <span className="print-brand-name">Jiddu</span>
          <span className="print-brand-tag">truth is a pathless land</span>
        </div>
        <h1>{title}</h1>
        {context.summary ? (
          <p className="print-summary">{context.summary}</p>
        ) : null}
        <dl className="print-meta">
          <dt>{t.print_meta_type}</dt>
          <dd>{t.live_context_recap}</dd>
          <dt>{t.print_meta_generated}</dt>
          <dd>{formatDate(createdAt, lang)}</dd>
          {audioDurationMs ? (
            <>
              <dt>Live</dt>
              <dd>{formatDuration(audioDurationMs)}</dd>
            </>
          ) : null}
          <dt>{t.print_meta_model}</dt>
          <dd>{model}</dd>
          <dt>{t.print_meta_url}</dt>
          <dd>https://jiddu.app/live/{id}</dd>
        </dl>
      </header>

      {tags.length > 0 ? (
        <section className="print-section">
          <h2>{t.live_context_tags}</h2>
          <ul className="live-print-chips">
            {tags.map((tag) => (
              <li key={tag.id}>{tag.label}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {context.topics.length > 0 ? (
        <section className="print-section">
          <h2>{t.live_context_topics}</h2>
          <ul className="live-print-list">
            {context.topics.map((topic) => (
              <li key={topic.id}>{topic.label}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {context.terms.length > 0 ? (
        <section className="print-section">
          <h2>{t.live_context_glossary}</h2>
          <dl className="live-print-glossary">
            {context.terms.map((term) => (
              <div key={term.id}>
                <dt>{term.term}</dt>
                <dd>{term.explanation}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {context.segments.length > 0 ? (
        <section className="print-section">
          <h2>{t.live_context_topic_changes}</h2>
          <ol className="live-print-segments">
            {context.segments.map((segment) => (
              <li key={segment.id}>
                <strong>{segment.title}</strong>
                <p>{segment.summary}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {relatedLinks.length > 0 ? (
        <section className="print-section">
          <h2>{t.live_context_related_links}</h2>
          <ol className="live-print-links">
            {relatedLinks.map((link) => (
              <li key={link.url}>
                <a href={link.url}>{link.title}</a>
                <span>{link.source}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="print-section print-source-text">
        <h2>{t.print_section_source_text}</h2>
        <p>{transcript}</p>
      </section>

      <footer className="print-footer">
        {relatedLinks.length > 0 ? (
          <p>{t.live_context_related_links_hint}</p>
        ) : null}
        <p className="print-muted">
          {t.print_generated_at(formatDate(new Date(), lang))}
        </p>
      </footer>
    </div>
  );
}

function formatDate(date: Date, lang: Lang): string {
  const locale = lang === "pt" ? "pt-BR" : lang === "es" ? "es-ES" : "en-US";
  return formatAppDateTime(date, locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const LIVE_CONTEXT_PRINT_CSS = `
  .live-print-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 0;
    list-style: none;
  }
  .live-print-chips li {
    border: 1px solid #bbb;
    border-radius: 999px;
    padding: 3px 9px;
    font: 11px ui-sans-serif, system-ui, sans-serif;
  }
  .live-print-list, .live-print-segments, .live-print-links {
    margin: 0;
    padding-left: 20px;
  }
  .live-print-list li, .live-print-segments li, .live-print-links li {
    margin-bottom: 8px;
    page-break-inside: avoid;
  }
  .live-print-segments p {
    margin: 2px 0 0;
    font-size: 13px;
  }
  .live-print-glossary > div {
    border-top: 1px solid #ddd;
    padding: 8px 0;
    page-break-inside: avoid;
  }
  .live-print-glossary dt { font-weight: 700; }
  .live-print-glossary dd { margin: 2px 0 0; font-size: 13px; }
  .live-print-links a { display: block; }
  .live-print-links span {
    color: #666;
    display: block;
    font: 10px ui-sans-serif, system-ui, sans-serif;
  }
`;
