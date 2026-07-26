"use client";

import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PAPER_REVIEW_DISCLAIMER } from "@/lib/paper-review-markdown";
import type { PaperReviewResult } from "@/lib/paper-review-schema";
import type { ResolvedVenueProfile } from "@/lib/venues";

export function PaperReviewPrintView({
  review,
  model,
  id,
  venueProfile,
}: {
  review: PaperReviewResult;
  model: string;
  id: string;
  venueProfile: ResolvedVenueProfile | null;
}) {
  useEffect(() => {
    if (window.location.search.includes("nopr")) return;
    const timer = setTimeout(() => window.print(), 250);
    return () => clearTimeout(timer);
  }, []);

  return (
    <article className="review-print">
      <style>{PRINT_CSS}</style>
      <header>
        <div className="brand">Jiddu · AI Paper Review</div>
        <h1>{review.paper}</h1>
        <dl>
          <dt>Author</dt>
          <dd>{review.author}</dd>
          <dt>Venue target</dt>
          <dd>{review.venueTarget}</dd>
          <dt>Review date</dt>
          <dd>{review.reviewDate}</dd>
          <dt>Model</dt>
          <dd>{model}</dd>
          <dt>URL</dt>
          <dd>https://jiddu.app/r/{id}</dd>
        </dl>
      </header>

      {venueProfile && (
        <>
          <h2>Venue Standard Applied</h2>
          <p>
            <strong>
              {venueProfile.profileVerified
                ? "Verified official profile"
                : "Unverified profile"}
              :
            </strong>{" "}
            {venueProfile.verificationNote}
          </p>
          <ul>
            {venueProfile.criteria.map((criterion) => (
              <li key={criterion.key}>
                <strong>{criterion.label}:</strong> {criterion.guidance}
              </li>
            ))}
          </ul>
        </>
      )}

      <h2>Stage Findings</h2>
      <Finding label="Story" text={review.stageFindings.story} />
      <Finding label="Presentation" text={review.stageFindings.presentation} />
      <Finding label="Evaluations" text={review.stageFindings.evaluations} />
      <Finding label="Correctness" text={review.stageFindings.correctness} />
      <Finding label="Significance" text={review.stageFindings.significance} />

      <h2>Review</h2>
      <h3>Summary</h3>
      <Md text={review.summary} />

      <h3>Strengths</h3>
      <ul>
        {review.strengths.map((strength, index) => (
          <li key={index}>
            <Md text={strength.text} />
            <small>{strength.locations.join("; ")}</small>
          </li>
        ))}
      </ul>

      <h3>Weaknesses</h3>
      <ol>
        {review.weaknesses.map((weakness) => (
          <li key={weakness.id}>
            <strong>
              [{weakness.id} — {weakness.severity}] {weakness.title}.
            </strong>{" "}
            <Md text={weakness.body} />
            <small>{weakness.locations.join("; ")}</small>
          </li>
        ))}
      </ol>

      <h3>Questions for the Authors</h3>
      <ol>
        {review.questions.map((question, index) => (
          <li key={index}>
            <Md text={question} />
          </li>
        ))}
      </ol>

      <h3>Overall Assessment</h3>
      <Md text={review.overallAssessment} />
      <ol>
        {review.publicationPath.map((step, index) => (
          <li key={index}>
            <Md text={step} />
          </li>
        ))}
      </ol>

      <p className="recommendation">
        <strong>Recommendation:</strong> {review.recommendation}.
      </p>
      <footer>{PAPER_REVIEW_DISCLAIMER}</footer>
    </article>
  );
}

function Finding({ label, text }: { label: string; text: string }) {
  return (
    <section>
      <h3>{label}</h3>
      <Md text={text} />
    </section>
  );
}

function Md({ text }: { text: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>;
}

const PRINT_CSS = `
  .review-print {
    max-width: 760px;
    margin: 0 auto;
    padding: 32px 24px 48px;
    background: white;
    color: #111;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 13px;
    line-height: 1.55;
  }
  .review-print .brand {
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: .12em;
    color: #555;
  }
  .review-print h1 { font-size: 28px; line-height: 1.2; margin: 12px 0; }
  .review-print h2 {
    margin-top: 28px;
    padding-top: 12px;
    border-top: 1px solid #bbb;
    font-size: 19px;
  }
  .review-print h3 { font-size: 15px; margin: 18px 0 5px; }
  .review-print p { margin: 4px 0 9px; }
  .review-print li { margin-bottom: 10px; }
  .review-print dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 3px 12px;
    border-top: 1px solid #ddd;
    border-bottom: 1px solid #ddd;
    padding: 10px 0;
    font-family: ui-sans-serif, system-ui, sans-serif;
    font-size: 10px;
  }
  .review-print dt { color: #666; text-transform: uppercase; }
  .review-print dd { margin: 0; }
  .review-print small { display: block; color: #666; margin-top: 3px; }
  .review-print .recommendation {
    border: 1px solid #999;
    padding: 12px;
    margin-top: 22px;
    font-size: 15px;
  }
  .review-print footer {
    border-top: 1px solid #ddd;
    margin-top: 24px;
    padding-top: 10px;
    color: #666;
    font-style: italic;
    font-size: 10px;
  }
  .review-print a { color: #1749b1; word-break: break-all; }
  @media print {
    @page { size: A4; margin: 16mm; }
    .review-print { max-width: none; padding: 0; }
    .review-print li, .review-print section { break-inside: avoid; }
  }
`;
