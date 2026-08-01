"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Megaphone,
  Quote,
  ArrowRightLeft,
  GitBranch,
  EyeOff,
  Scale,
  Compass,
  Fingerprint,
} from "lucide-react";
import type { Sentence } from "@/lib/schema";
import type {
  NeutralityFinding,
  NeutralityIssue,
  NeutralityVerdictValue,
  TextType,
} from "@/lib/neutrality-schema";
import { cn } from "@/lib/utils";
import { onActivate } from "@/lib/a11y";
import { ShareLinkBar } from "@/components/share-link-bar";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { useI18n } from "@/lib/i18n/provider";
import type { Messages } from "@/lib/i18n/messages";

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
  status: string;
  model: string;
};

// Per-issue visual identity. Icons are chosen to hint at the failure mode
// (loaded language → megaphone, omission → eye-off, etc.). Colors pick a
// distinct hue so eight findings in one document don't collapse into one
// undifferentiated wall.
const ISSUE_META: Record<
  NeutralityIssue,
  { icon: typeof Quote; labelKey: keyof Messages; cls: string }
> = {
  loaded_language: {
    icon: Megaphone,
    labelKey: "ni_loaded_language",
    cls: "border-red-500/40 text-red-500",
  },
  asymmetric_attribution: {
    icon: ArrowRightLeft,
    labelKey: "ni_asymmetric_attribution",
    cls: "border-amber-500/40 text-amber-500",
  },
  false_equivalence: {
    icon: Scale,
    labelKey: "ni_false_equivalence",
    cls: "border-purple-500/40 text-purple-500",
  },
  selective_omission: {
    icon: EyeOff,
    labelKey: "ni_selective_omission",
    cls: "border-blue-500/40 text-blue-500",
  },
  source_asymmetry: {
    icon: Quote,
    labelKey: "ni_source_asymmetry",
    cls: "border-pink-500/40 text-pink-500",
  },
  both_sidesing: {
    icon: GitBranch,
    labelKey: "ni_both_sidesing",
    cls: "border-emerald-500/40 text-emerald-500",
  },
  steering: {
    icon: Compass,
    labelKey: "ni_steering",
    cls: "border-cyan-500/40 text-cyan-500",
  },
  genetic_framing: {
    icon: Fingerprint,
    labelKey: "ni_genetic_framing",
    cls: "border-orange-500/40 text-orange-500",
  },
};

// Explicit RGB values that mirror the Tailwind palette used in
// ISSUE_META.cls above. Needed because mark.highlight reads its tint
// from a CSS custom property, and Tailwind class names don't carry a
// directly-readable color value. Keep these in sync with ISSUE_META —
// changing one without the other will break the visual match between
// the sentence highlight and the finding-card dot.
const ISSUE_COLOR: Record<NeutralityIssue, string> = {
  loaded_language: "rgb(239, 68, 68)", // red-500
  asymmetric_attribution: "rgb(245, 158, 11)", // amber-500
  false_equivalence: "rgb(168, 85, 247)", // purple-500
  selective_omission: "rgb(59, 130, 246)", // blue-500
  source_asymmetry: "rgb(236, 72, 153)", // pink-500
  both_sidesing: "rgb(16, 185, 129)", // emerald-500
  steering: "rgb(6, 182, 212)", // cyan-500
  genetic_framing: "rgb(249, 115, 22)", // orange-500
};

const VERDICT_META: Record<
  NeutralityVerdictValue,
  { icon: typeof CheckCircle; labelKey: keyof Messages; cls: string }
> = {
  neutral: {
    icon: CheckCircle,
    labelKey: "nv_neutral",
    cls: "border-emerald-500/50 text-emerald-500 bg-emerald-500/5",
  },
  partisan_lean: {
    icon: AlertTriangle,
    labelKey: "nv_partisan_lean",
    cls: "border-amber-500/50 text-amber-500 bg-amber-500/5",
  },
  explicitly_partisan: {
    icon: AlertTriangle,
    labelKey: "nv_explicitly_partisan",
    cls: "border-orange-500/50 text-orange-500 bg-orange-500/5",
  },
  manipulation: {
    icon: XCircle,
    labelKey: "nv_manipulation",
    cls: "border-red-500/50 text-red-500 bg-red-500/5",
  },
};

function textTypeLabelKey(tt: TextType): keyof Messages {
  return `tt_${tt}` as keyof Messages;
}

export function NeutralityView({
  id,
  title,
  sourceRef,
  source,
  text,
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

  const paragraphs = useMemo(
    () => groupIntoParagraphs(text, sentences),
    [text, sentences],
  );

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

      <ShareLinkBar rightSlot={<ExportPdfButton href={`/n/${id}/print`} />} />

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
          {paragraphs.map((para, pIdx) => (
            <p key={pIdx} className={pIdx > 0 ? "mt-4" : undefined}>
              {para.map((s, sIdx) => {
                const flags = findingsBySentence.get(s.id);
                const hasFlag = !!flags?.length;
                if (!hasFlag) {
                  return (
                    <span key={s.id} id={`s-${s.id}`}>
                      {s.text}
                      {sIdx < para.length - 1 && " "}
                    </span>
                  );
                }
                // Multi-issue sentences: take the first finding's color
                // so the highlight aligns with the first card a click
                // would scroll to.
                const firstFinding = flags![0];
                const color =
                  ISSUE_COLOR[firstFinding.issue] ?? "currentColor";
                const firstIdx = findings.indexOf(firstFinding);
                const isActive =
                  active === `finding-${firstIdx}`;
                return (
                  <mark
                    key={s.id}
                    id={`s-${s.id}`}
                    className="highlight"
                    data-active={isActive ? "true" : undefined}
                    role="button"
                    tabIndex={0}
                    aria-label={t.a11y_show_signal}
                    style={
                      {
                        "--highlight-color": color,
                      } as React.CSSProperties
                    }
                    onClick={() => scrollToFinding(firstIdx)}
                    onKeyDown={onActivate(() => scrollToFinding(firstIdx))}
                  >
                    {s.text}
                    {sIdx < para.length - 1 && " "}
                  </mark>
                );
              })}
            </p>
          ))}
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

function groupIntoParagraphs(
  text: string,
  sentences: Sentence[],
): Sentence[][] {
  if (sentences.length === 0) return [];
  const groups: Sentence[][] = [[sentences[0]]];
  for (let i = 1; i < sentences.length; i++) {
    const prev = sentences[i - 1];
    const cur = sentences[i];
    const between = text.slice(prev.end, cur.start);
    if (/\n\s*\n/.test(between)) {
      groups.push([cur]);
    } else {
      groups[groups.length - 1].push(cur);
    }
  }
  return groups;
}
