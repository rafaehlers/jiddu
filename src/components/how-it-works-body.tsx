"use client";

import { Fragment } from "react";
import { useI18n } from "@/lib/i18n/provider";
import {
  JIDDU_CREDIT_RATE_VERSION,
  MODEL_CREDIT_RATES,
} from "@/lib/jiddu-credit-rates";

// Technical walkthrough of every Jiddu pipeline. Same content pattern as
// LegalBody: structured array of {title, paragraphs} lives in i18n so the
// three locales stay in sync. Paragraphs render markdown-style links —
// [label](url) — inline.
export function HowItWorksBody() {
  const { lang, t } = useI18n();
  const sections = t.how_it_works_sections;
  const liveTranscriptionCredits =
    MODEL_CREDIT_RATES["gpt-live-transcribe"];
  return (
    <article className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-10 sm:py-16 flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl sm:text-4xl">
          {t.how_it_works_title}
        </h1>
        <p className="text-base text-muted">{t.how_it_works_subtitle}</p>
      </header>

      {/* Tiny TOC — anchor links to each section so a reader can scan. */}
      <nav className="text-base text-muted border border-rule rounded-md p-4 flex flex-col gap-1">
        {sections.map((s, i) => (
          <a
            key={i}
            href={`#section-${i}`}
            className="underline decoration-rule hover:decoration-foreground transition-colors"
          >
            {s.title}
          </a>
        ))}
      </nav>

      {sections.map((s, i) => {
        let subsectionNumber = 0;
        return (
          <section
            key={i}
            id={`section-${i}`}
            className="flex flex-col gap-3 scroll-mt-16"
          >
            <h2 className="font-serif text-xl">{s.title}</h2>
            <div className="flex flex-col gap-4">
              {s.paragraphs.map((p, j) => {
                const { heading, body } = splitLeadingHeading(p);
                const creditTable =
                  j === 0 && s.creditTable ? (
                    <PublicCreditRateTable
                      table={s.creditTable}
                      liveTranscriptionCredits={liveTranscriptionCredits}
                      locale={lang === "pt" ? "pt-BR" : lang === "es" ? "es" : "en-US"}
                    />
                  ) : null;
                if (!heading) {
                  return (
                    <Fragment key={j}>
                      <p className="text-base leading-relaxed text-foreground/85">
                        {renderInline(body)}
                      </p>
                      {creditTable}
                    </Fragment>
                  );
                }

                subsectionNumber += 1;
                return (
                  <Fragment key={j}>
                    <div className="min-w-0">
                      <h3 className="mb-1 font-serif text-lg leading-snug text-foreground">
                        <span className="mr-2" aria-hidden="true">
                          {i + 1}.{subsectionNumber}
                        </span>
                        {heading}
                      </h3>
                      <p className="text-base leading-relaxed text-foreground/85">
                        {renderInline(body)}
                      </p>
                    </div>
                    {creditTable}
                  </Fragment>
                );
              })}
            </div>
          </section>
        );
      })}
    </article>
  );
}

type CreditTable = NonNullable<
  ReturnType<typeof useI18n>["t"]["how_it_works_sections"][number]["creditTable"]
>;

function PublicCreditRateTable({
  table,
  liveTranscriptionCredits,
  locale,
}: {
  table: CreditTable;
  liveTranscriptionCredits: number;
  locale: string;
}) {
  const replacements = {
    "{liveCredits}": Math.ceil(liveTranscriptionCredits).toLocaleString(locale),
    "{rateVersion}": JIDDU_CREDIT_RATE_VERSION,
  };
  const interpolate = (text: string) =>
    Object.entries(replacements).reduce(
      (result, [token, value]) => result.replaceAll(token, value),
      text,
    );

  return (
    <div className="my-2 space-y-3">
      <p className="text-sm leading-relaxed text-muted">{table.intro}</p>
      <div className="overflow-x-auto rounded-lg border border-rule">
        <table className="w-full min-w-[42rem] text-sm">
          <thead className="bg-paper text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">
                {table.headers.feature}
              </th>
              <th className="px-4 py-3 font-medium">{table.headers.unit}</th>
              <th className="px-4 py-3 font-medium">
                {table.headers.estimate}
              </th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.feature} className="border-t border-rule">
                <td className="px-4 py-3 font-medium">{row.feature}</td>
                <td className="px-4 py-3 text-muted">{row.unit}</td>
                <td className="px-4 py-3">{interpolate(row.estimate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-rule px-4 py-3 text-xs leading-relaxed text-muted">
          {interpolate(table.note)}
        </p>
      </div>
    </div>
  );
}

// A paragraph may start with a markdown-style bold label. On this page that
// label is structural — promote it to a real subheading instead of leaving it
// buried in the first line of body copy.
function splitLeadingHeading(text: string): {
  heading: string | null;
  body: string;
} {
  const match = text.match(/^\*\*([^*]+)\*\*\s*([\s\S]*)$/);
  if (!match) return { heading: null, body: text };
  return {
    heading: match[1].replace(/\.$/, ""),
    body: match[2],
  };
}

// Same minimal markdown renderer as LegalBody, plus **bold** and `code` — this
// content uses bold to call out inline terms (e.g. "**URL.**",
// "**disambiguation**") and backticks constantly for routes/env vars/model
// ids (e.g. "`/live`", "`OPENAI_API_KEY`"), neither of which LegalBody's copy
// needs. Keep duplicated for now — extracting to a shared util is overkill
// for three call sites (this, LegalBody, ApiAccessBody).
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;
  let cursor = 0;
  let m: RegExpExecArray | null;
  let keyCounter = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > cursor) parts.push(text.slice(cursor, m.index));
    if (m[4] !== undefined) {
      parts.push(
        <code
          key={`c-${keyCounter++}`}
          className="text-[0.85em] bg-paper border border-rule rounded px-1 py-0.5"
        >
          {m[4]}
        </code>,
      );
    } else if (m[3] !== undefined) {
      parts.push(
        <strong key={`b-${keyCounter++}`} className="font-medium text-foreground">
          {m[3]}
        </strong>,
      );
    } else {
      const isExternal = m[2].startsWith("http");
      parts.push(
        <a
          key={`l-${keyCounter++}`}
          href={m[2]}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="underline decoration-rule hover:decoration-foreground transition-colors"
        >
          {m[1]}
        </a>,
      );
    }
    cursor = m.index + m[0].length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts.length === 1 ? (
    parts[0]
  ) : (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>{p}</Fragment>
      ))}
    </>
  );
}
