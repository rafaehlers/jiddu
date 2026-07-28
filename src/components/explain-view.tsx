"use client";
/* eslint-disable react-hooks/refs -- DOM refs are read only in effects and interaction/ref callbacks. */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Target,
  FlaskConical,
  BarChart3,
  Lightbulb,
  AlertTriangle,
  Flag,
  GraduationCap,
} from "lucide-react";
import type { Block } from "@/lib/paragraphs";
import type { ExplainFinding, ExplainLevel, SectionRole } from "@/lib/explain-schema";
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
  blocks: Block[];
  findings: ExplainFinding[];
  overview: string;
  level: ExplainLevel;
  status: string;
  model: string;
};

// Per-role visual identity. The color drives both the in-text paragraph
// highlight and the legend / card chip, so the reader can see the paper's
// skeleton (background → method → result → conclusion) by hue alone.
const ROLE_META: Record<
  SectionRole,
  { icon: typeof BookOpen; labelKey: keyof Messages; cls: string }
> = {
  background: { icon: BookOpen, labelKey: "role_background", cls: "border-blue-500/40 text-blue-500" },
  objective: { icon: Target, labelKey: "role_objective", cls: "border-purple-500/40 text-purple-500" },
  method: { icon: FlaskConical, labelKey: "role_method", cls: "border-cyan-500/40 text-cyan-500" },
  result: { icon: BarChart3, labelKey: "role_result", cls: "border-emerald-500/40 text-emerald-500" },
  interpretation: { icon: Lightbulb, labelKey: "role_interpretation", cls: "border-amber-500/40 text-amber-500" },
  limitation: { icon: AlertTriangle, labelKey: "role_limitation", cls: "border-orange-500/40 text-orange-500" },
  conclusion: { icon: Flag, labelKey: "role_conclusion", cls: "border-pink-500/40 text-pink-500" },
};

// Explicit RGB values mirroring the Tailwind classes above — mark.highlight
// reads its tint from a CSS custom property, and class names don't carry a
// directly-readable color value. Keep in sync with ROLE_META.
const ROLE_COLOR: Record<SectionRole, string> = {
  background: "rgb(59, 130, 246)", // blue-500
  objective: "rgb(168, 85, 247)", // purple-500
  method: "rgb(6, 182, 212)", // cyan-500
  result: "rgb(16, 185, 129)", // emerald-500
  interpretation: "rgb(245, 158, 11)", // amber-500
  limitation: "rgb(249, 115, 22)", // orange-500
  conclusion: "rgb(236, 72, 153)", // pink-500
};

function levelLabelKey(level: ExplainLevel): keyof Messages {
  return `level_${level}` as keyof Messages;
}

export function ExplainView({
  id,
  title,
  sourceRef,
  source,
  blocks,
  findings,
  overview,
  level,
  status,
  model,
}: Props) {
  const { t } = useI18n();

  // Map each block id to the explanation that covers it, and remember the
  // card index so a click on the paragraph scrolls to the right card.
  const { findingByBlock, ordered } = useMemo(() => {
    const blockPos = new Map(blocks.map((b, i) => [b.id, i]));
    // Display cards in document order (by the first block each covers).
    const orderedList = findings
      .map((f) => ({
        f,
        pos: Math.min(
          ...f.blockIds.map((bid) => blockPos.get(bid) ?? Number.POSITIVE_INFINITY),
        ),
      }))
      .sort((a, b) => a.pos - b.pos)
      .map((x, idx) => ({ ...x, cardIdx: idx }));

    const byBlock = new Map<string, { f: ExplainFinding; cardIdx: number }>();
    for (const item of orderedList) {
      for (const bid of item.f.blockIds) {
        if (!byBlock.has(bid)) byBlock.set(bid, { f: item.f, cardIdx: item.cardIdx });
      }
    }
    return { findingByBlock: byBlock, ordered: orderedList };
  }, [blocks, findings]);

  const [active, setActive] = useState<number | null>(null);

  // Anchored-card layout. Each explanation card is absolutely positioned next
  // to the paragraph it explains (offset = the paragraph's top within the
  // article), with a downward push so cards that would overlap stack instead.
  // This keeps every card beside its text — clicking a paragraph no longer
  // sends the reader on a multi-thousand-pixel scroll to a card piled at the
  // top. Mirrors the fallacy detector's comment layout (analysis-view.tsx).
  const articleRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const [cardOffsets, setCardOffsets] = useState<Map<number, number>>(new Map());
  const [asideMinHeight, setAsideMinHeight] = useState<number>(0);

  const measure = () => {
    const container = articleRef.current;
    if (!container) return;
    const containerTop = container.getBoundingClientRect().top;

    const items: { cardIdx: number; top: number; height: number }[] = [];
    for (const { f, cardIdx } of ordered) {
      const anchorId = f.blockIds[0];
      const node = container.querySelector<HTMLElement>(`[data-bid="${anchorId}"]`);
      if (!node) continue;
      const top = node.getBoundingClientRect().top - containerTop;
      const h = cardRefs.current.get(cardIdx)?.getBoundingClientRect().height ?? 120;
      items.push({ cardIdx, top, height: h });
    }

    items.sort((a, b) => a.top - b.top);
    const gap = 12;
    const offsets = new Map<number, number>();
    let cursor = 0;
    for (const it of items) {
      const y = Math.max(it.top, cursor);
      offsets.set(it.cardIdx, y);
      cursor = y + it.height + gap;
    }
    setCardOffsets(offsets);
    setAsideMinHeight(Math.max(cursor, container.offsetHeight));
  };

  useLayoutEffect(() => {
    measure();
    // Re-measure once the serif webfont swaps in — paragraph heights shift.
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => measure()).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordered, blocks]);

  useEffect(() => {
    const handler = () => measure();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordered, blocks]);

  function focusCard(cardIdx: number) {
    setActive(cardIdx);
    const el = cardRefs.current.get(cardIdx);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function focusBlock(blockId: string, cardIdx: number) {
    setActive(cardIdx);
    const el = articleRef.current?.querySelector<HTMLElement>(`[data-bid="${blockId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Roles actually present, in canonical order, for the legend.
  const rolesPresent = useMemo(() => {
    const order: SectionRole[] = [
      "background",
      "objective",
      "method",
      "result",
      "interpretation",
      "limitation",
      "conclusion",
    ];
    const present = new Set(findings.map((f) => f.role));
    return order.filter((r) => present.has(r));
  }, [findings]);

  return (
    <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
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
          <span>{t[levelLabelKey(level)] as string}</span>
          <span>·</span>
          <span>
            {findings.length}{" "}
            {findings.length === 1
              ? t.explanations_count_one
              : t.explanations_count_many}
          </span>
          <span>·</span>
          <span>{model}</span>
          <span>·</span>
          <span className="capitalize">{status}</span>
        </div>
      </header>

      <ShareLinkBar rightSlot={<ExportPdfButton href={`/e/${id}/print`} />} />

      {/* Overview panel — the plain-language abstract at the chosen level. */}
      {overview && (
        <div className="border border-rule rounded-lg p-5 flex items-start gap-4 bg-paper">
          <GraduationCap className="h-7 w-7 shrink-0 text-muted" />
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <span className="text-xs uppercase tracking-wide text-muted">
              {t.explain_overview_label} · {t[levelLabelKey(level)] as string}
            </span>
            <p className="text-base leading-relaxed text-foreground">{overview}</p>
          </div>
        </div>
      )}

      {/* Legend of section roles present in this paper. */}
      {rolesPresent.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {rolesPresent.map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border border-rule text-muted"
            >
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: ROLE_COLOR[r] }}
              />
              {t[ROLE_META[r].labelKey] as string}
            </span>
          ))}
        </div>
      )}

      {/* Two-column layout: paper left, explanations right (anchored). */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_28rem] gap-6">
        {/* Left: the paper, each paragraph tinted by its role. */}
        <article
          ref={articleRef}
          className="font-serif text-lg leading-relaxed bg-paper border border-rule rounded-lg p-6"
        >
          {blocks.map((b, i) => {
            // Render the paper's own section heading as a divider whenever the
            // section changes (hybrid view: paragraph-level cards, but the
            // real 1 / 1.1 / 2 structure shown inline on the left).
            const showHeading =
              !!b.section && (i === 0 || blocks[i - 1].section !== b.section);
            const heading = showHeading ? (
              <h3
                className={cn(
                  "font-sans text-xs font-medium uppercase tracking-wider text-muted border-t border-rule pt-3 mb-2",
                  i > 0 ? "mt-6" : undefined,
                )}
              >
                {b.section}
              </h3>
            ) : null;
            const pClass = i > 0 && !showHeading ? "mt-4" : undefined;

            const hit = findingByBlock.get(b.id);
            if (!hit) {
              return (
                <div key={b.id}>
                  {heading}
                  <p id={`b-${b.id}`} data-bid={b.id} className={pClass}>
                    {b.text}
                  </p>
                </div>
              );
            }
            const color = ROLE_COLOR[hit.f.role] ?? "currentColor";
            const isActive = active === hit.cardIdx;
            return (
              <div key={b.id}>
                {heading}
                <p id={`b-${b.id}`} data-bid={b.id} className={pClass}>
                  <mark
                    className="highlight"
                    data-active={isActive ? "true" : undefined}
                    role="button"
                    tabIndex={0}
                    aria-label={t.a11y_show_explanation}
                    style={{ "--highlight-color": color } as React.CSSProperties}
                    onClick={() => focusCard(hit.cardIdx)}
                    onKeyDown={onActivate(() => focusCard(hit.cardIdx))}
                  >
                    {b.text}
                  </mark>
                </p>
              </div>
            );
          })}
        </article>

        {/* Right: one explanation card per paragraph, anchored to its text. */}
        <aside
          className="relative flex flex-col gap-3 lg:gap-0 lg:block lg:min-h-[var(--aside-min-h)]"
          style={{ "--aside-min-h": `${asideMinHeight}px` } as React.CSSProperties}
        >
          {ordered.length === 0 ? (
            <div className="text-sm text-muted bg-paper border border-rule rounded-lg p-6">
              {t.explain_empty}
            </div>
          ) : (
            ordered.map(({ f, cardIdx }) => {
              const meta = ROLE_META[f.role] ?? ROLE_META.background;
              const Icon = meta.icon;
              const isActive = active === cardIdx;
              const color = ROLE_COLOR[f.role] ?? "currentColor";
              const offset = cardOffsets.get(cardIdx) ?? 0;
              return (
                <div
                  key={cardIdx}
                  id={`card-${cardIdx}`}
                  ref={(el) => {
                    cardRefs.current.set(cardIdx, el);
                  }}
                  onClick={() => focusBlock(f.blockIds[0], cardIdx)}
                  className={cn(
                    "lg:absolute lg:left-0 lg:right-0 cursor-pointer",
                    "bg-paper border rounded-lg p-4 flex flex-col gap-2 transition-colors",
                    isActive ? "card-active" : "border-rule hover:border-foreground",
                  )}
                  style={
                    {
                      top: `${offset}px`,
                      ...(isActive
                        ? { borderColor: color, "--card-color": color }
                        : {}),
                    } as React.CSSProperties
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted font-mono inline-flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className="inline-block h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      #{cardIdx + 1}
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
                  <p className="text-sm leading-relaxed text-foreground">
                    {f.explanation}
                  </p>
                </div>
              );
            })
          )}
        </aside>
      </div>

      <p className="text-xs text-muted mt-2">{t.explain_footer(model)}</p>
    </div>
  );
}
