"use client";
/* eslint-disable react-hooks/refs -- DOM refs are read only in effects and interaction/ref callbacks. */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FALLACY_BY_ID } from "@/lib/fallacies";
import type { Finding, Sentence } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { onActivate } from "@/lib/a11y";
import { useI18n } from "@/lib/i18n/provider";
import { FallacyModal } from "@/components/fallacy-modal";
import { FindingModal } from "@/components/finding-modal";
import { MobileHintModal } from "@/components/mobile-hint-modal";
import { ShareLinkBar } from "@/components/share-link-bar";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { useMobileHint } from "@/lib/mobile-hint";

const MOBILE_BREAKPOINT = 1024; // matches Tailwind's `lg`

type Props = {
  id: string;
  title: string | null;
  sourceRef: string | null;
  source: string;
  text: string;
  sentences: Sentence[];
  findings: Finding[];
  score: number | null;
  summary: string;
  provider: string;
  model: string;
};

type FindingWithKey = Finding & { key: string };

export function AnalysisView({
  id,
  title,
  sourceRef,
  source,
  text,
  sentences,
  findings,
  score,
  summary,
  provider,
  model,
}: Props) {
  const { t, lang } = useI18n();
  const keyedFindings: FindingWithKey[] = useMemo(
    () => findings.map((f, i) => ({ ...f, key: `f${i}` })),
    [findings],
  );

  const findingsBySentence = useMemo(() => {
    const m = new Map<string, FindingWithKey[]>();
    for (const f of keyedFindings) {
      for (const sid of f.sentenceIds) {
        if (!m.has(sid)) m.set(sid, []);
        m.get(sid)!.push(f);
      }
    }
    return m;
  }, [keyedFindings]);

  const [active, setActive] = useState<string | null>(null);
  const [modalFallacyId, setModalFallacyId] = useState<string | null>(null);
  const [findingForModal, setFindingForModal] = useState<FindingWithKey | null>(null);
  const { showHint, dismissHint } = useMobileHint();
  const textColRef = useRef<HTMLDivElement>(null);
  const commentsColRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const commentRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const [commentOffsets, setCommentOffsets] = useState<Map<string, number>>(new Map());
  const [asideMinHeight, setAsideMinHeight] = useState<number>(0);

  const measure = () => {
    if (!textColRef.current) return;
    const container = textColRef.current;
    const containerTop = container.getBoundingClientRect().top;
    const scoreHeight = scoreRef.current?.offsetHeight ?? 0;
    const scoreGap = scoreHeight > 0 ? scoreHeight + 16 : 0;

    const items: { key: string; top: number; height: number }[] = [];
    for (const f of keyedFindings) {
      const firstId = f.sentenceIds[0];
      const node = container.querySelector<HTMLElement>(`[data-sid="${firstId}"]`);
      if (!node) continue;
      const r = node.getBoundingClientRect();
      const commentNode = commentRefs.current.get(f.key);
      const h = commentNode?.getBoundingClientRect().height ?? 120;
      items.push({ key: f.key, top: r.top - containerTop, height: h });
    }

    items.sort((a, b) => a.top - b.top);
    const gap = 12;
    const offsets = new Map<string, number>();
    let cursor = scoreGap;
    for (const it of items) {
      const y = Math.max(it.top, cursor);
      offsets.set(it.key, y);
      cursor = y + it.height + gap;
    }
    setCommentOffsets(offsets);
    setAsideMinHeight(Math.max(cursor, container.offsetHeight));
  };

  useLayoutEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyedFindings, text]);

  useEffect(() => {
    const handler = () => measure();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyedFindings]);

  function focusFinding(key: string) {
    setActive(key);
    const f = keyedFindings.find((x) => x.key === key);
    if (!f) return;
    const firstId = f.sentenceIds[0];
    const node = textColRef.current?.querySelector<HTMLElement>(`[data-sid="${firstId}"]`);
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function focusSentence(sid: string) {
    const list = findingsBySentence.get(sid);
    if (!list || list.length === 0) return;
    const f = list[0];
    setActive(f.key);
    // On narrow viewports the comments stack way below the article, so jumping
    // to them would take the reader far from the passage. Open the modal
    // instead. On wide layouts the comments are anchored beside the sentence,
    // so scrollIntoView is the right move.
    if (typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT) {
      setFindingForModal(f);
      return;
    }
    const node = commentRefs.current.get(f.key);
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const segments = useMemo(() => buildSegments(text, sentences), [text, sentences]);

  return (
    <div className="flex-1 flex flex-col">
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <h1 className="font-serif text-2xl md:text-3xl tracking-tight">
            {title ?? "Untitled"}
          </h1>
          {sourceRef && (
            <p className="text-sm text-muted truncate">
              {source === "url" ? (
                <a href={sourceRef} target="_blank" rel="noopener noreferrer" className="underline">
                  {sourceRef}
                </a>
              ) : (
                sourceRef
              )}
            </p>
          )}
        </div>
        {summary && (
          <p className="text-foreground/90 text-base max-w-3xl">{summary}</p>
        )}
        <p className="text-xs text-muted">
          {provider} · {model} · {t.finding_count(keyedFindings.length, sentences.length)}
        </p>
      </div>

      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-10 grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-6 lg:gap-8">
        <article
          ref={textColRef}
          className="bg-paper border border-rule rounded-lg p-5 sm:p-8 font-serif text-base sm:text-lg leading-[1.75] text-ink"
        >
          {segments.map((seg, i) => {
            if (seg.type === "gap") {
              return <span key={`g${i}`} style={{ whiteSpace: "pre-wrap" }}>{seg.text}</span>;
            }
            const s = seg.sentence;
            const fs = findingsBySentence.get(s.id);
            if (!fs || fs.length === 0) {
              return (
                <span key={s.id} data-sid={s.id}>
                  {s.text}
                </span>
              );
            }
            const isActive = fs.some((f) => f.key === active);
            const color = FALLACY_BY_ID[fs[0].fallacy]?.color ?? "currentColor";
            const names = fs
              .map((f) => FALLACY_BY_ID[f.fallacy]?.name[lang] ?? f.fallacy)
              .join(", ");
            return (
              <mark
                key={s.id}
                data-sid={s.id}
                data-active={isActive ? "true" : undefined}
                className="fallacy"
                role="button"
                tabIndex={0}
                aria-label={`${t.a11y_show_fallacy}: ${names}`}
                onClick={() => focusSentence(s.id)}
                onKeyDown={onActivate(() => focusSentence(s.id))}
                title={names}
                style={
                  {
                    "--fallacy-color": color,
                  } as React.CSSProperties
                }
              >
                {s.text}
              </mark>
            );
          })}
          {keyedFindings.length === 0 && (
            <p className="mt-6 text-sm text-muted italic">{t.no_fallacies}</p>
          )}
        </article>

        <aside
          ref={commentsColRef}
          className="relative flex flex-col gap-3 lg:gap-0 lg:block lg:min-h-[var(--aside-min-h)]"
          style={{ "--aside-min-h": `${asideMinHeight}px` } as React.CSSProperties}
        >
          <div ref={scoreRef} className="lg:absolute lg:top-0 lg:left-0 lg:right-0">
            {score === null ? <PendingBadge /> : <ScoreBadge score={score} />}
          </div>
          {keyedFindings.map((f) => {
            const def = FALLACY_BY_ID[f.fallacy];
            const offset = commentOffsets.get(f.key) ?? 0;
            const color = def?.color ?? "currentColor";
            const isActive = active === f.key;
            return (
              <div
                key={f.key}
                ref={(el) => {
                  commentRefs.current.set(f.key, el);
                }}
                onClick={() => focusFinding(f.key)}
                className={cn(
                  "lg:absolute lg:left-0 lg:right-0 cursor-pointer",
                  "bg-paper border rounded-md p-3 shadow-sm transition-colors",
                  isActive ? "card-active" : "border-rule hover:border-foreground",
                )}
                style={
                  {
                    top: `${offset}px`,
                    "--fallacy-color": color,
                    // Active state: borrow the fallacy color for the
                    // border so the card visually echoes the sentence
                    // highlight, and feed --card-color to the shared
                    // card-pulse keyframe in globals.css. The pulse
                    // fires once when the class flips to active;
                    // afterwards the colored border persists.
                    ...(isActive
                      ? {
                          borderColor: color,
                          "--card-color": color,
                        }
                      : {}),
                  } as React.CSSProperties
                }
                data-severity={f.severity}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="inline-block h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalFallacyId(f.fallacy);
                    }}
                    className="font-medium text-sm hover:underline underline-offset-2 text-left"
                  >
                    {def?.name[lang] ?? f.fallacy}
                  </button>
                  <span className="text-xs text-muted ml-auto uppercase tracking-wide">
                    {f.severity === "high" ? t.severity_high : t.severity_low}
                  </span>
                </div>
                <blockquote className="text-sm text-muted italic mb-2 border-l-2 border-rule pl-2 line-clamp-3">
                  “{f.quote}”
                </blockquote>
                <p className="text-sm leading-snug">{f.explanation}</p>
              </div>
            );
          })}
        </aside>
      </div>

      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-16 grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-8">
        <ShareLinkBar rightSlot={<ExportPdfButton href={`/a/${id}/print`} />} />
      </div>

      <FallacyModal
        fallacyId={modalFallacyId}
        onClose={() => setModalFallacyId(null)}
      />

      <FindingModal
        finding={findingForModal}
        onClose={() => setFindingForModal(null)}
      />

      <MobileHintModal open={showHint} onClose={dismissHint} />
    </div>
  );
}

function PendingBadge() {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3 bg-paper border border-rule rounded-lg px-4 py-3">
      <div className="font-serif text-3xl font-semibold text-muted tabular-nums flex items-baseline gap-2">
        <span className="text-base text-muted uppercase tracking-wide font-sans font-normal">
          {t.score_label}
        </span>
        <span>—</span>
        <span className="text-base text-muted">/100</span>
      </div>
      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap border border-rule text-muted">
        {t.pending}
      </span>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const { t } = useI18n();
  const tone = score >= 61 ? "var(--severity-high)" : "var(--severity-low)";
  const label =
    score >= 81
      ? t.score_propagandistic
      : score >= 61
        ? t.score_high
        : score >= 36
          ? t.score_several
          : score >= 16
            ? t.score_minor
            : t.score_clean;
  return (
    <div className="flex items-center gap-3 bg-paper border border-rule rounded-lg px-4 py-3">
      <div className="font-serif text-3xl font-semibold tabular-nums flex items-baseline gap-2">
        <span className="text-base text-muted uppercase tracking-wide font-sans font-normal">
          {t.score_label}
        </span>
        <span style={{ color: tone }}>{score}</span>
        <span className="text-base text-muted">/100</span>
      </div>
      <span
        className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap border"
        style={{
          color: tone,
          borderColor: `color-mix(in oklab, ${tone} 40%, transparent)`,
          backgroundColor: `color-mix(in oklab, ${tone} 14%, transparent)`,
        }}
      >
        {label}
      </span>
    </div>
  );
}

type Segment =
  | { type: "sentence"; sentence: Sentence }
  | { type: "gap"; text: string };

function buildSegments(text: string, sentences: Sentence[]): Segment[] {
  const segs: Segment[] = [];
  let cursor = 0;
  for (const s of sentences) {
    if (s.start > cursor) {
      segs.push({ type: "gap", text: text.slice(cursor, s.start) });
    }
    segs.push({ type: "sentence", sentence: s });
    cursor = s.end;
  }
  if (cursor < text.length) {
    segs.push({ type: "gap", text: text.slice(cursor) });
  }
  return segs;
}
