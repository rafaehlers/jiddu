"use client";

import { useMemo, useState } from "react";
import type { Sentence } from "@/lib/schema";
import type {
  NeutralityFinding,
  NeutralityVerdictValue,
  TextType,
} from "@/lib/neutrality-schema";
import { cn } from "@/lib/utils";
import { onActivate } from "@/lib/a11y";
import { ReportDeliveryActions } from "@/components/report-delivery-actions";
import { ShareLinkBar } from "@/components/share-link-bar";
import { StructuredDocumentText } from "@/components/structured-document-text";
import type { Block } from "@/lib/paragraphs";
import { useI18n } from "@/lib/i18n/provider";
import type { Messages } from "@/lib/i18n/messages";
import {
  NEUTRALITY_ISSUE_COLOR as ISSUE_COLOR,
  NEUTRALITY_ISSUE_META as ISSUE_META,
  NEUTRALITY_VERDICT_META as VERDICT_META,
} from "@/components/neutrality-visuals";

type Props = {
  canEmail: boolean;
  id: string;
  title: string | null;
  sourceRef: string | null;
  source: string;
  text: string;
  blocks: Block[];
  sentences: Sentence[];
  findings: NeutralityFinding[];
  verdict: NeutralityVerdictValue;
  confidence: number;
  rationale: string;
  textType: TextType;
  status: string;
  model: string;
};

function textTypeLabelKey(tt: TextType): keyof Messages {
  return `tt_${tt}` as keyof Messages;
}

export function NeutralityView({
  canEmail,
  id,
  title,
  sourceRef,
  source,
  text,
  blocks,
  sentences,
  findings,
  verdict,
  confidence,
  rationale,
  textType,
  status,
  model,
}: Props) {
  const { t } = useI18n();
  const findingsBySentence = useMemo(() => {
    const m = new Map<string, NeutralityFinding[]>();
    for (const f of findings) {
      for (const sid of f.sentenceIds) {
        if (!m.has(sid)) m.set(sid, []);
        m.get(sid)!.push(f);
      }
    }
    return m;
  }, [findings]);

  const [active, setActive] = useState<string | null>(null);

  function scrollToFinding(i: number) {
    const el = document.getElementById(`finding-${i}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setActive(`finding-${i}`);
    }
  }

  function scrollToSentence(sentenceIds: string[]) {
    const sid = sentenceIds[0];
    const el = document.getElementById(`s-${sid}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function renderSentence(s: Sentence) {
    const flags = findingsBySentence.get(s.id);
    if (!flags?.length) {
      return <span id={`s-${s.id}`}>{s.text}</span>;
    }
    const firstFinding = flags[0];
    const color = ISSUE_COLOR[firstFinding.issue] ?? "currentColor";
    const firstIdx = findings.indexOf(firstFinding);
    const isActive = active === `finding-${firstIdx}`;
    return (
      <mark
        id={`s-${s.id}`}
        className="highlight"
        data-active={isActive ? "true" : undefined}
        role="button"
        tabIndex={0}
        aria-label={t.a11y_show_signal}
        style={{ "--highlight-color": color } as React.CSSProperties}
        onClick={() => scrollToFinding(firstIdx)}
        onKeyDown={onActivate(() => scrollToFinding(firstIdx))}
      >
        {s.text}
      </mark>
    );
  }

  const vMeta = VERDICT_META[verdict];
  const VIcon = vMeta.icon;

  return (
    <div className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-2xl sm:text-3xl leading-tight">
          {title ?? t.fc_untitled}
        </h1>
        {sourceRef && source === "url" && (
          <a
            href={sourceRef}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted hover:text-foreground transition-colors break-all"
          >
            {sourceRef}
          </a>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          <span>{t[textTypeLabelKey(textType)] as string}</span>
          <span>·</span>
          <span>
            {findings.length}{" "}
            {findings.length === 1
              ? t.findings_found_one
              : t.findings_found_many}
          </span>
          <span>·</span>
          <span>{model}</span>
          <span>·</span>
          <span className="capitalize">{status}</span>
        </div>
      </header>

      <ShareLinkBar
        rightSlot={
          <ReportDeliveryActions
            canEmail={canEmail}
            id={id}
            kind="n"
            printHref={`/n/${id}/print`}
          />
        }
      />

      {/* Top verdict panel — equivalent of the "score panel" in the fallacy
          view. Big visual statement of where the document landed. */}
      <div
        className={cn(
          "border rounded-lg p-5 flex items-start gap-4 flex-wrap",
          vMeta.cls,
        )}
      >
        <VIcon className="h-8 w-8 shrink-0" />
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-medium text-lg">
              {t[vMeta.labelKey] as string}
            </span>
            <span className="text-sm opacity-70 font-mono">
              {Math.round(confidence * 100)}% {t.neutrality_confidence}
            </span>
          </div>
          {rationale && (
            <p className="text-sm leading-snug opacity-90 text-foreground">
              {rationale}
            </p>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_28rem] gap-6">
        {/* Left: text */}
        <article className="font-serif text-lg leading-relaxed text-balance bg-paper border border-rule rounded-lg p-6">
          <StructuredDocumentText
            text={text}
            blocks={blocks}
            sentences={sentences}
            renderSentence={renderSentence}
          />
        </article>

        {/* Right: findings */}
        <aside className="flex flex-col gap-4">
          <h2 className="font-medium text-sm text-muted uppercase tracking-wide">
            {t.findings_found_many.replace(/^\w/, (c) => c.toUpperCase())} (
            {findings.length})
          </h2>
          {findings.length === 0 ? (
            <div className="text-sm text-muted bg-paper border border-rule rounded-lg p-6">
              {t.neutrality_no_issues}
            </div>
          ) : (
            <ol className="flex flex-col gap-3">
              {findings.map((f, idx) => {
                const meta = ISSUE_META[f.issue] ?? ISSUE_META.loaded_language;
                const Icon = meta.icon;
                // When this card is active we borrow the issue-type color
                // for the border (matching the sentence highlight on the
                // left) and attach .card-active to fire the radial pulse
                // defined in globals.css. --card-color drives both.
                const isActive = active === `finding-${idx}`;
                const color = ISSUE_COLOR[f.issue] ?? "currentColor";
                return (
                  <li
                    key={idx}
                    id={`finding-${idx}`}
                    className={cn(
                      "bg-paper border rounded-lg p-4 flex flex-col gap-2 cursor-pointer transition-colors",
                      isActive ? "card-active" : "border-rule",
                    )}
                    style={
                      isActive
                        ? ({
                            borderColor: color,
                            "--card-color": color,
                          } as React.CSSProperties)
                        : undefined
                    }
                    onClick={() => {
                      setActive(`finding-${idx}`);
                      scrollToSentence(f.sentenceIds);
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted font-mono inline-flex items-center gap-1.5">
                        <span
                          aria-hidden
                          className="inline-block h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        #{idx + 1}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border",
                            f.severity === "high"
                              ? "border-[var(--severity-high)]/50 text-[var(--severity-high)]"
                              : "border-rule text-muted",
                          )}
                        >
                          {f.severity}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border",
                            meta.cls,
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          {t[meta.labelKey] as string}
                        </span>
                      </div>
                    </div>
                    <blockquote className="text-sm leading-relaxed italic border-l-2 border-rule pl-3 py-0.5">
                      &ldquo;{f.quote}&rdquo;
                    </blockquote>
                    <p className="text-xs text-muted leading-snug">
                      {f.explanation}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </aside>
      </div>

      <p className="text-xs text-muted mt-2">{t.neutrality_footer(model)}</p>
    </div>
  );
}
