"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, X } from "lucide-react";
import { SLOP_BY_ID, SLOP_CATEGORY_LABELS } from "@/lib/slop";
import type { SlopFinding } from "@/lib/slop-schema";
import type { Sentence } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { onActivate } from "@/lib/a11y";
import { useI18n } from "@/lib/i18n/provider";
import { MobileHintModal } from "@/components/mobile-hint-modal";
import { ShareLinkBar } from "@/components/share-link-bar";
import { ExportPdfButton } from "@/components/export-pdf-button";

const MOBILE_BREAKPOINT = 1024; // matches Tailwind's `lg`
const MOBILE_HINT_KEY = "mobileHintSeen";

// Viewer for the slop-pattern lens. Same reading idiom as AnalysisView
// (colored sentence highlights on the left, color-matched margin cards on
// the right, score badge on top) with the slop catalog driving names and
// colors. The pattern/finding dialogs live here rather than reusing the
// fallacy modals, which are hard-wired to FALLACY_BY_ID and the guide page.

type Props = {
  id: string;
  title: string | null;
  sourceRef: string | null;
  source: string;
  text: string;
  sentences: Sentence[];
  findings: SlopFinding[];
  score: number | null;
  summary: string;
  provider: string;
  model: string;
};

type FindingWithKey = SlopFinding & { key: string };

export function SlopView({
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
  const [modalPatternId, setModalPatternId] = useState<string | null>(null);
  const [findingForModal, setFindingForModal] = useState<FindingWithKey | null>(null);
  // Starts false on server and client so hydration matches; the width /
  // localStorage check runs post-hydration (see AnalysisView for the why).
  const [showHint, setShowHint] = useState<boolean>(false);
  useEffect(() => {
    try {
      if (
        window.innerWidth < MOBILE_BREAKPOINT &&
        localStorage.getItem(MOBILE_HINT_KEY) !== "1"
      ) {
        setShowHint(true);
      }
    } catch {}
  }, []);

  function dismissHint() {
    setShowHint(false);
    try {
      localStorage.setItem(MOBILE_HINT_KEY, "1");
    } catch {}
  }
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
          {provider} · {model} · {t.slop_finding_count(keyedFindings.length, sentences.length)}
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
            const color = SLOP_BY_ID[fs[0].pattern]?.color ?? "currentColor";
            const names = fs
              .map((f) => SLOP_BY_ID[f.pattern]?.name[lang] ?? f.pattern)
              .join(", ");
            return (
              <mark
                key={s.id}
                data-sid={s.id}
                data-active={isActive ? "true" : undefined}
                className="highlight"
                role="button"
                tabIndex={0}
                aria-label={`${t.a11y_show_slop}: ${names}`}
                onClick={() => focusSentence(s.id)}
                onKeyDown={onActivate(() => focusSentence(s.id))}
                title={names}
                style={
                  {
                    "--highlight-color": color,
                  } as React.CSSProperties
                }
              >
                {s.text}
              </mark>
            );
          })}
          {keyedFindings.length === 0 && (
            <p className="mt-6 text-sm text-muted italic">{t.no_slop}</p>
          )}
        </article>

        <aside
          ref={commentsColRef}
          className="relative flex flex-col gap-3 lg:gap-0 lg:block lg:min-h-[var(--aside-min-h)]"
          style={{ "--aside-min-h": `${asideMinHeight}px` } as React.CSSProperties}
        >
          <div ref={scoreRef} className="lg:absolute lg:top-0 lg:left-0 lg:right-0">
            {score === null ? <PendingBadge /> : <SlopScoreBadge score={score} />}
          </div>
          {keyedFindings.map((f) => {
            const def = SLOP_BY_ID[f.pattern];
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
                    "--highlight-color": color,
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
                      setModalPatternId(f.pattern);
                    }}
                    className="font-medium text-sm hover:underline underline-offset-2 text-left"
                  >
                    {def?.name[lang] ?? f.pattern}
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
        <ShareLinkBar rightSlot={<ExportPdfButton href={`/s/${id}/print`} />} />
      </div>

      <SlopPatternModal
        patternId={modalPatternId}
        onClose={() => setModalPatternId(null)}
      />

      <SlopFindingModal
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

function SlopScoreBadge({ score }: { score: number }) {
  const { t } = useI18n();
  const tone = score >= 61 ? "var(--severity-high)" : "var(--severity-low)";
  const label =
    score >= 81
      ? t.slop_score_assembly
      : score >= 61
        ? t.slop_score_heavy
        : score >= 36
          ? t.slop_score_several
          : score >= 16
            ? t.slop_score_light
            : t.slop_score_clean;
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

// Catalog entry dialog — the slop counterpart of FallacyModal, linking to
// the pattern's anchor on the /slop-patterns guide page.
function SlopPatternModal({
  patternId,
  onClose,
}: {
  patternId: string | null;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (patternId && !dialog.open) dialog.showModal();
    else if (!patternId && dialog.open) dialog.close();
  }, [patternId]);

  function onDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) onClose();
  }

  const p = patternId ? SLOP_BY_ID[patternId] : null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={onDialogClick}
      className="m-auto bg-transparent p-0 border-0 outline-none backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      {p && (
        <div className="bg-paper text-foreground border border-rule rounded-lg shadow-2xl max-w-2xl w-[90vw] max-h-[85vh] overflow-y-auto">
          <header className="flex items-start gap-3 p-6 pb-3 border-b border-rule sticky top-0 bg-paper">
            <span
              className="inline-block h-3 w-3 rounded-full mt-2 shrink-0"
              style={{ backgroundColor: p.color }}
              aria-hidden
            />
            <div className="flex-1 min-w-0">
              <h2 className="font-serif text-2xl leading-tight">{p.name[lang]}</h2>
              <p className="text-xs text-muted uppercase tracking-wide mt-1">
                {t.category} · {SLOP_CATEGORY_LABELS[p.category][lang]}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.close}
              className="text-muted hover:text-foreground transition-colors p-1 -mr-1"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="p-6 flex flex-col gap-4">
            <p className="text-foreground/90 leading-relaxed">{p.description[lang]}</p>
            <blockquote className="border-l-2 pl-4 text-muted italic" style={{ borderColor: p.color }}>
              <span className="text-xs not-italic uppercase tracking-wide block mb-1 text-muted">
                {t.guide_example}
              </span>
              {p.example[lang]}
            </blockquote>
          </div>
          <footer className="px-6 py-4 border-t border-rule">
            <Link
              href={`/slop-patterns#${p.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              {t.open_in_guide}
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </footer>
        </div>
      )}
    </dialog>
  );
}

// Mobile per-finding dialog — the slop counterpart of FindingModal.
function SlopFindingModal({
  finding,
  onClose,
}: {
  finding: SlopFinding | null;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (finding && !dialog.open) dialog.showModal();
    else if (!finding && dialog.open) dialog.close();
  }, [finding]);

  function onDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) onClose();
  }

  const def = finding ? SLOP_BY_ID[finding.pattern] : null;
  const color = def?.color ?? "currentColor";

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={onDialogClick}
      className="m-auto bg-transparent p-0 border-0 outline-none backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      {def && finding && (
        <div className="bg-paper text-foreground border border-rule rounded-lg shadow-2xl max-w-xl w-[92vw] max-h-[85vh] overflow-y-auto">
          <header className="flex items-start gap-3 p-5 sm:p-6 pb-3 border-b border-rule sticky top-0 bg-paper">
            <span
              className="inline-block h-3 w-3 rounded-full mt-2 shrink-0"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <h2 className="font-serif text-xl sm:text-2xl leading-tight">
                {def.name[lang]}
              </h2>
              <span
                className="self-start px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap border"
                style={{
                  color,
                  borderColor: `color-mix(in oklab, ${color} 40%, transparent)`,
                  backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`,
                }}
              >
                {finding.severity === "high" ? t.severity_high : t.severity_low}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.close}
              className="text-muted hover:text-foreground transition-colors p-1 -mr-1 shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="p-5 sm:p-6 flex flex-col gap-5">
            <section className="flex flex-col gap-2">
              <h3 className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                {t.finding_from_text}
              </h3>
              <blockquote
                className="text-sm italic text-muted border-l-2 pl-3"
                style={{ borderColor: color }}
              >
                “{finding.quote}”
              </blockquote>
              <p className="text-sm leading-relaxed">{finding.explanation}</p>
            </section>

            <section className="flex flex-col gap-2 pt-3 border-t border-rule">
              <h3 className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                {t.finding_about_this_pattern}
              </h3>
              <p className="text-sm leading-relaxed text-foreground/85">
                {def.description[lang]}
              </p>
              <blockquote className="text-sm italic text-muted border-l-2 border-rule pl-3 mt-1">
                <span className="not-italic text-[10px] uppercase tracking-wide block mb-1">
                  {t.guide_example}
                </span>
                {def.example[lang]}
              </blockquote>
            </section>
          </div>
        </div>
      )}
    </dialog>
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
