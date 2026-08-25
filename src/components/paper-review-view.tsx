"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  Search,
  ShieldCheck,
} from "lucide-react";
import { ShareLinkBar } from "@/components/share-link-bar";
import { DownloadMarkdownButton } from "@/components/download-markdown-button";
import { ReportDeliveryActions } from "@/components/report-delivery-actions";
import { ReportTitle } from "@/components/report-title";
import { VenueStandardCard } from "@/components/venue-standard-card";
import { PAPER_REVIEW_DISCLAIMER } from "@/lib/paper-review-markdown";
import type {
  PaperReviewResult,
  ReviewSeverity,
} from "@/lib/paper-review-schema";
import { cn } from "@/lib/utils";
import type { ResolvedVenueProfile } from "@/lib/venues";

type Props = {
  canEditTitle: boolean;
  canEmail: boolean;
  id: string;
  title: string;
  review: PaperReviewResult;
  model: string;
  parser: string | null;
  status: string;
  venueProfile: ResolvedVenueProfile | null;
};

const SEVERITY_STYLE: Record<ReviewSeverity, string> = {
  MAJOR:
    "border-[var(--severity-high)]/50 text-[var(--severity-high)] bg-[color-mix(in_oklab,var(--severity-high)_8%,transparent)]",
  MODERATE:
    "border-[var(--severity-medium)]/50 text-[var(--severity-medium)] bg-[color-mix(in_oklab,var(--severity-medium)_8%,transparent)]",
  MINOR:
    "border-[var(--severity-low)]/50 text-[var(--severity-low)] bg-[color-mix(in_oklab,var(--severity-low)_8%,transparent)]",
};

export function PaperReviewView({
  canEditTitle,
  canEmail,
  id,
  title,
  review,
  model,
  parser,
  status,
  venueProfile,
}: Props) {
  return (
    <div className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <span className="text-xs uppercase tracking-[0.16em] text-muted">
          AI Paper Review
        </span>
        <ReportTitle
          canEdit={canEditTitle}
          className="font-serif text-3xl leading-tight sm:text-4xl"
          fallback={review.paper}
          id={id}
          kind="r"
          title={title}
        />
        <p className="text-foreground/80">{review.author}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <span>{review.venueTarget}</span>
          <span>{review.reviewDate}</span>
          <span>{model}</span>
          {parser && <span>{parser}</span>}
          <span className="capitalize">{status}</span>
        </div>
      </header>

      <ShareLinkBar
        rightSlot={
          <ReportDeliveryActions
            canEmail={canEmail}
            id={id}
            kind="r"
            printHref={`/r/${id}/print`}
          >
            <DownloadMarkdownButton href={`/api/review/${id}/markdown`} />
          </ReportDeliveryActions>
        }
      />

      {venueProfile && <VenueStandardCard profile={venueProfile} />}

      {review.audit && (
        <section className="border border-rule rounded-lg bg-paper p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[var(--severity-low)]" />
            <h2 className="font-serif text-xl">Review quality audit</h2>
            <span className="ml-auto text-xs uppercase tracking-wide text-muted">
              {review.audit.depth}
            </span>
          </div>
          <p className="text-sm text-muted">{review.audit.methodology}</p>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <AuditMetric
              label="Specialist findings"
              value={review.audit.specialistFindings}
            />
            <AuditMetric
              label="Retained"
              value={review.audit.retainedFindings}
            />
            <AuditMetric
              label="Calculation failures"
              value={`${review.audit.computationFailures}/${review.audit.computationChecks}`}
            />
            <AuditMetric
              label="Sources verified"
              value={`${review.audit.sourcesVerified}/${review.audit.sourcesVerified + review.audit.sourcesUnverified}`}
            />
          </dl>
          <p className="text-xs text-muted">
            Independent critic: {review.audit.criticModel} ·{" "}
            {review.audit.criticFlags} flag
            {review.audit.criticFlags === 1 ? "" : "s"}
          </p>
        </section>
      )}

      <section className="border border-rule rounded-lg bg-paper p-5 sm:p-6 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-5 w-5 text-muted" />
          <h2 className="font-serif text-xl">Summary</h2>
        </div>
        <MarkdownText text={review.summary} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-2xl">Stage Findings</h2>
        <div className="grid grid-cols-1 gap-3">
          <StageFinding label="Story" text={review.stageFindings.story} />
          <StageFinding
            label="Presentation"
            text={review.stageFindings.presentation}
          />
          <StageFinding
            label="Evaluations"
            text={review.stageFindings.evaluations}
          />
          <StageFinding
            label="Correctness"
            text={review.stageFindings.correctness}
          />
          <StageFinding
            label="Significance"
            text={review.stageFindings.significance}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-2xl">Strengths</h2>
        {review.strengths.length === 0 ? (
          <p className="text-muted">No defensible strengths were retained.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {review.strengths.map((strength, index) => (
              <li
                key={`${index}-${strength.text.slice(0, 20)}`}
                className="border border-rule rounded-lg bg-paper p-4 flex gap-3"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--severity-low)] mt-0.5" />
                <div className="flex flex-col gap-2">
                  <MarkdownText text={strength.text} />
                  <Locations locations={strength.locations} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-2xl">Weaknesses</h2>
          <span className="text-sm text-muted">
            {review.weaknesses.length} retained
          </span>
        </div>
        <ol className="flex flex-col gap-4">
          {review.weaknesses.map((weakness, index) => (
            <li
              key={weakness.id}
              className="border border-rule rounded-lg bg-paper overflow-hidden"
            >
              <div className="p-4 sm:p-5 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-sm text-muted mt-0.5">
                    {index + 1}.
                  </span>
                  <div className="flex-1 flex flex-col gap-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex text-[11px] font-semibold tracking-wide px-2 py-0.5 rounded-full border",
                          SEVERITY_STYLE[weakness.severity],
                        )}
                      >
                        {weakness.id} · {weakness.severity}
                      </span>
                      <h3 className="font-serif text-lg">{weakness.title}</h3>
                    </div>
                    <MarkdownText text={weakness.body} />
                    <Locations locations={weakness.locations} />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-2xl">Questions for the Authors</h2>
        <ol className="list-decimal pl-5 flex flex-col gap-3">
          {review.questions.map((question, index) => (
            <li key={`${index}-${question.slice(0, 20)}`} className="pl-2">
              <MarkdownText text={question} />
            </li>
          ))}
        </ol>
      </section>

      <section className="border border-rule rounded-lg bg-paper p-5 sm:p-6 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-muted" />
          <h2 className="font-serif text-2xl">Overall Assessment</h2>
        </div>
        <MarkdownText text={review.overallAssessment} />
        <div>
          <h3 className="text-xs uppercase tracking-wide text-muted mb-3">
            Short path to publication
          </h3>
          <ol className="list-decimal pl-5 flex flex-col gap-2">
            {review.publicationPath.map((step, index) => (
              <li key={`${index}-${step.slice(0, 20)}`} className="pl-2">
                <MarkdownText text={step} />
              </li>
            ))}
          </ol>
        </div>
        <div className="border-t border-rule pt-5 flex flex-wrap items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-muted">
            Recommendation
          </span>
          <span className="font-serif text-xl">{review.recommendation}</span>
        </div>
      </section>

      {review.sources.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-serif text-xl">Published literature consulted</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {review.sources.map((source) => (
              <li key={source.url} className="flex flex-wrap items-center gap-2">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-hi hover:underline break-all"
                >
                  {source.title || source.url}
                </a>
                {source.verificationStatus && (
                  <span
                    title={source.verificationNote}
                    className={cn(
                      "inline-flex text-[10px] uppercase tracking-wide rounded border px-1.5 py-0.5",
                      source.verificationStatus === "verified"
                        ? "border-[var(--severity-low)]/40 text-[var(--severity-low)]"
                        : source.verificationStatus === "mismatch"
                          ? "border-[var(--severity-high)]/40 text-[var(--severity-high)]"
                          : "border-rule text-muted",
                    )}
                  >
                    {source.verificationStatus}
                  </span>
                )}
                {source.publicationType && (
                  <span className="text-xs text-muted">
                    {source.publicationType}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="border-t border-rule pt-5 text-sm text-muted italic">
        {PAPER_REVIEW_DISCLAIMER}
      </footer>
    </div>
  );
}

function AuditMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded border border-rule px-3 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-medium mt-0.5">{value}</dd>
    </div>
  );
}

function StageFinding({
  label,
  text,
  icon,
}: {
  label: string;
  text: string;
  icon?: React.ReactNode;
}) {
  return (
    <article className="border border-rule rounded-lg bg-paper p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-[9rem_1fr] gap-2 sm:gap-5">
      <h3 className="font-medium flex items-center gap-2">
        {icon}
        {label}
      </h3>
      <MarkdownText text={text} />
    </article>
  );
}

function Locations({ locations }: { locations: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {locations.map((location) => (
        <span
          key={location}
          className="inline-flex text-xs font-mono px-2 py-0.5 rounded border border-rule text-muted"
        >
          {location}
        </span>
      ))}
    </div>
  );
}

function MarkdownText({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="leading-relaxed text-foreground/90">{children}</p>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-hi hover:underline"
          >
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
