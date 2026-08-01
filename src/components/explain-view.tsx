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
  Compass,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ListTree,
} from "lucide-react";
import type { Block } from "@/lib/paragraphs";
import {
  getExplainableFindings,
  groupExplainSections,
  type ExplainSection,
} from "@/lib/explain-sections";
import type {
  ExplainFinding,
  ExplainLevel,
  PaperMap,
  SectionRole,
} from "@/lib/explain-schema";
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
  paperMap: PaperMap | null;
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
  paperMap,
  level,
  status,
  model,
}: Props) {
  const { t } = useI18n();

  const sections = useMemo(() => groupExplainSections(blocks), [blocks]);
  const contentSections = useMemo(
    () => sections.filter((section) => !section.isReferences),
    [sections],
  );
  const referenceSections = useMemo(
    () => sections.filter((section) => section.isReferences),
    [sections],
  );
  const explainableFindings = useMemo(
    () => getExplainableFindings(findings, blocks),
    [findings, blocks],
  );
  const [selectedSectionId, setSelectedSectionId] = useState(
    () => contentSections[0]?.id ?? sections[0]?.id ?? "",
  );
  const selectedSection =
    sections.find((section) => section.id === selectedSectionId) ??
    contentSections[0] ??
    sections[0] ??
    null;
  const selectedBlocks = useMemo(
    () => selectedSection?.blocks ?? [],
    [selectedSection],
  );
  const selectedBlockIds = useMemo(
    () => new Set(selectedBlocks.map((block) => block.id)),
    [selectedBlocks],
  );
  const sectionIdByBlock = useMemo(() => {
    const result = new Map<string, string>();
    for (const section of sections) {
      for (const block of section.blocks) result.set(block.id, section.id);
    }
    return result;
  }, [sections]);

  // Map each block id to the explanation that covers it, and remember the
  // card index so a click on the paragraph scrolls to the right card.
  const { findingByBlock, ordered } = useMemo(() => {
    const blockPos = new Map(blocks.map((b, i) => [b.id, i]));
    // Display cards in document order (by the first block each covers).
    const orderedList = explainableFindings
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
  }, [blocks, explainableFindings]);
  const visibleOrdered = useMemo(
    () => ordered.filter(({ f }) => f.blockIds.some((id) => selectedBlockIds.has(id))),
    [ordered, selectedBlockIds],
  );
  const findingCountBySection = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { f } of ordered) {
      const sectionId = f.blockIds.map((id) => sectionIdByBlock.get(id)).find(Boolean);
      if (sectionId) counts.set(sectionId, (counts.get(sectionId) ?? 0) + 1);
    }
    return counts;
  }, [ordered, sectionIdByBlock]);

  const [active, setActive] = useState<number | null>(null);

  // Anchored-card layout. Each explanation card is absolutely positioned next
  // to the paragraph it explains (offset = the paragraph's top within the
  // article), with a downward push so cards that would overlap stack instead.
  // This keeps every card beside its text — clicking a paragraph no longer
  // sends the reader on a multi-thousand-pixel scroll to a card piled at the
  // top. Mirrors the fallacy detector's comment layout (analysis-view.tsx).
  const readerRef = useRef<HTMLElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const pendingBlockRef = useRef<string | null>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const [cardOffsets, setCardOffsets] = useState<Map<number, number>>(new Map());
  const [asideMinHeight, setAsideMinHeight] = useState<number>(0);

  const measure = () => {
    const container = articleRef.current;
    if (!container) return;
    const containerTop = container.getBoundingClientRect().top;

    const items: { cardIdx: number; top: number; height: number }[] = [];
    for (const { f, cardIdx } of visibleOrdered) {
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
  }, [visibleOrdered, selectedBlocks]);

  useEffect(() => {
    const handler = () => measure();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleOrdered, selectedBlocks]);

  useLayoutEffect(() => {
    const blockId = pendingBlockRef.current;
    if (!blockId) return;
    const frame = window.requestAnimationFrame(() => {
      const el = articleRef.current?.querySelector<HTMLElement>(`[data-bid="${blockId}"]`);
      if (!el) return;
      pendingBlockRef.current = null;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedSectionId, selectedBlocks]);

  function focusCard(cardIdx: number) {
    setActive(cardIdx);
    const el = cardRefs.current.get(cardIdx);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function focusBlock(blockId: string, cardIdx?: number) {
    const resolvedCard = cardIdx ?? findingByBlock.get(blockId)?.cardIdx ?? null;
    setActive(resolvedCard);
    const targetSectionId = sectionIdByBlock.get(blockId);
    if (targetSectionId && targetSectionId !== selectedSectionId) {
      pendingBlockRef.current = blockId;
      setSelectedSectionId(targetSectionId);
      return;
    }
    const el = articleRef.current?.querySelector<HTMLElement>(`[data-bid="${blockId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function selectSection(sectionId: string) {
    pendingBlockRef.current = null;
    setActive(null);
    setSelectedSectionId(sectionId);
    window.requestAnimationFrame(() => {
      readerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function focusRole(role: SectionRole) {
    const match = ordered.find(({ f }) => f.role === role);
    if (match) focusBlock(match.f.blockIds[0], match.cardIdx);
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
    const present = new Set(explainableFindings.map((f) => f.role));
    return order.filter((r) => present.has(r));
  }, [explainableFindings]);

  const selectedContentIndex = selectedSection
    ? contentSections.findIndex((section) => section.id === selectedSection.id)
    : -1;
  const previousSection =
    selectedContentIndex > 0 ? contentSections[selectedContentIndex - 1] : null;
  const nextSection =
    selectedContentIndex >= 0 && selectedContentIndex < contentSections.length - 1
      ? contentSections[selectedContentIndex + 1]
      : null;

  function sectionTitle(section: ExplainSection, index: number): string {
    if (section.title) return section.title;
    if (sections.length === 1) return t.explain_document_section;
    if (index === 0) return t.explain_opening_section;
    return `${t.explain_section_fallback} ${index + 1}`;
  }

  const paperMapRows = paperMap
    ? [
        { label: t.explain_map_question, statement: paperMap.researchQuestion },
        { label: t.explain_map_contribution, statement: paperMap.contribution },
        { label: t.explain_map_approach, statement: paperMap.approach },
        { label: t.explain_map_answer, statement: paperMap.mainAnswer },
        { label: t.explain_map_evidence, statement: paperMap.evidence },
        { label: t.explain_map_limitation, statement: paperMap.statedLimitation },
      ].filter((row) => row.statement !== null)
    : [];
  const hasPaperMap =
    paperMap !== null &&
    (paperMap.paperTypes.length > 0 ||
      paperMap.contributionTypes.length > 0 ||
      paperMapRows.length > 0);

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
            {explainableFindings.length}{" "}
            {explainableFindings.length === 1
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

      {/* Whole-document reading map, synthesized after every chunk finishes. */}
      {hasPaperMap && paperMap && (
        <section className="border border-rule rounded-lg p-5 sm:p-6 bg-paper flex flex-col gap-5">
          <div className="flex items-start gap-4">
            <Compass className="h-7 w-7 shrink-0 text-muted" />
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              <h2 className="text-xs uppercase tracking-wide text-muted">
                {t.explain_map_label}
              </h2>
              <div className="flex flex-col gap-2">
                {paperMap.paperTypes.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted">
                      {t.explain_map_paper_type}
                    </span>
                    {paperMap.paperTypes.map((type) => (
                      <span
                        key={`paper-${type}`}
                        className="text-xs px-2 py-1 rounded-full border border-teal-500/35 text-teal-600 dark:text-teal-400"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                )}
                {paperMap.contributionTypes.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted">
                      {t.explain_map_contribution_type}
                    </span>
                    {paperMap.contributionTypes.map((type) => (
                      <span
                        key={`contribution-${type}`}
                        className="text-xs px-2 py-1 rounded-full border border-purple-500/35 text-purple-600 dark:text-purple-400"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {paperMapRows.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-rule rounded-md overflow-hidden">
              {paperMapRows.map(({ label, statement }) => {
                if (!statement) return null;
                const blockId = statement.blockIds[0];
                const content = (
                  <>
                    <span className="text-[11px] uppercase tracking-wide text-muted">
                      {label}
                    </span>
                    <span className="text-sm leading-relaxed text-foreground">
                      {statement.text}
                    </span>
                  </>
                );
                return blockId ? (
                  <button
                    key={label}
                    type="button"
                    onClick={() => focusBlock(blockId)}
                    className="min-w-0 text-left p-4 border-r border-b border-rule hover:bg-foreground/[0.035] transition-colors flex flex-col gap-1.5"
                    title={t.explain_map_open_evidence}
                  >
                    {content}
                  </button>
                ) : (
                  <div
                    key={label}
                    className="min-w-0 p-4 border-r border-b border-rule flex flex-col gap-1.5"
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Clickable legend doubles as a reading shortcut into the paper. */}
      {rolesPresent.length > 0 && (
        <nav
          aria-label={t.explain_jump_to}
          className="flex flex-wrap items-center gap-2"
        >
          <span className="text-xs text-muted mr-1">{t.explain_jump_to}</span>
          {rolesPresent.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => focusRole(r)}
              className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border border-rule text-muted hover:text-foreground hover:border-foreground transition-colors"
            >
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: ROLE_COLOR[r] }}
              />
              {t[ROLE_META[r].labelKey] as string}
            </button>
          ))}
        </nav>
      )}

      <section
        ref={readerRef}
        aria-labelledby="paper-reader-heading"
        className="scroll-mt-20 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ListTree className="h-4 w-4 text-muted" />
            <h2
              id="paper-reader-heading"
              className="text-xs uppercase tracking-wide text-muted"
            >
              {t.explain_reader_label}
            </h2>
          </div>
          {selectedContentIndex >= 0 && (
            <span className="text-xs text-muted">
              {t.explain_section_progress(
                selectedContentIndex + 1,
                contentSections.length,
              )}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[13rem_minmax(0,1fr)_24rem] gap-6 items-start">
          <nav
            aria-label={t.explain_sections_label}
            className="lg:col-span-2 xl:col-span-1 xl:sticky xl:top-20 min-w-0"
          >
            <label className="sr-only" htmlFor="explain-section-picker">
              {t.explain_sections_label}
            </label>
            <select
              id="explain-section-picker"
              value={selectedSection?.id ?? ""}
              onChange={(event) => selectSection(event.target.value)}
              className="xl:hidden w-full rounded-lg border border-rule bg-paper px-3 py-2.5 text-sm text-foreground"
            >
              {sections.map((section, index) => (
                <option key={section.id} value={section.id}>
                  {section.isReferences
                    ? `${t.explain_references_label} · ${sectionTitle(section, index)}`
                    : sectionTitle(section, index)}
                </option>
              ))}
            </select>

            <div className="hidden xl:flex max-h-[calc(100vh-6rem)] flex-col gap-1 overflow-y-auto rounded-lg border border-rule bg-paper p-2">
              <h3 className="px-2 pb-2 pt-1 text-[11px] uppercase tracking-wide text-muted">
                {t.explain_sections_label}
              </h3>
              {contentSections.map((section) => {
                const index = sections.findIndex((item) => item.id === section.id);
                const selected = selectedSection?.id === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    aria-current={selected ? "true" : undefined}
                    onClick={() => selectSection(section.id)}
                    className={cn(
                      "flex items-start justify-between gap-2 rounded-md border px-2.5 py-2 text-left text-sm leading-snug transition-colors",
                      selected
                        ? "border-foreground bg-foreground text-background"
                        : "border-transparent text-muted hover:border-rule hover:text-foreground",
                    )}
                  >
                    <span className="min-w-0 break-words">
                      {sectionTitle(section, index)}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-mono text-[10px]",
                        selected ? "text-background/70" : "text-muted",
                      )}
                    >
                      {findingCountBySection.get(section.id) ?? 0}
                    </span>
                  </button>
                );
              })}

              {referenceSections.length > 0 && (
                <details
                  className="group mt-1 border-t border-rule pt-2"
                  open={selectedSection?.isReferences || undefined}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm text-muted hover:text-foreground">
                    <span>{t.explain_references_label}</span>
                    <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-1 flex flex-col gap-1">
                    {referenceSections.map((section) => {
                      const index = sections.findIndex((item) => item.id === section.id);
                      const selected = selectedSection?.id === section.id;
                      return (
                        <button
                          key={section.id}
                          type="button"
                          aria-current={selected ? "true" : undefined}
                          onClick={() => selectSection(section.id)}
                          className={cn(
                            "rounded-md border px-2.5 py-2 text-left text-xs leading-snug transition-colors",
                            selected
                              ? "border-foreground bg-foreground text-background"
                              : "border-transparent text-muted hover:border-rule hover:text-foreground",
                          )}
                        >
                          {sectionTitle(section, index)}
                        </button>
                      );
                    })}
                  </div>
                </details>
              )}
            </div>
          </nav>

          <div className="min-w-0 flex flex-col gap-3">
            <header className="flex items-start justify-between gap-4 rounded-lg border border-rule bg-paper p-4">
              <div className="min-w-0">
                <span className="text-[11px] uppercase tracking-wide text-muted">
                  {selectedSection?.isReferences
                    ? t.explain_references_label
                    : t.explain_reader_label}
                </span>
                <h3 className="mt-1 font-serif text-xl leading-tight">
                  {selectedSection
                    ? sectionTitle(
                        selectedSection,
                        sections.findIndex((section) => section.id === selectedSection.id),
                      )
                    : t.explain_document_section}
                </h3>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  disabled={!previousSection}
                  onClick={() => previousSection && selectSection(previousSection.id)}
                  aria-label={t.explain_previous_section}
                  title={t.explain_previous_section}
                  className="rounded-md border border-rule p-2 text-muted transition-colors hover:border-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={!nextSection}
                  onClick={() => nextSection && selectSection(nextSection.id)}
                  aria-label={t.explain_next_section}
                  title={t.explain_next_section}
                  className="rounded-md border border-rule p-2 text-muted transition-colors hover:border-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </header>

            {selectedSection?.isReferences && (
              <p className="rounded-lg border border-rule bg-paper px-4 py-3 text-sm leading-relaxed text-muted">
                {t.explain_references_note}
              </p>
            )}

            <article
              ref={articleRef}
              className="font-serif text-lg leading-relaxed bg-paper border border-rule rounded-lg p-5 sm:p-6"
            >
              {selectedBlocks.map((block, index) => {
                const hit = findingByBlock.get(block.id);
                const paragraphClass = index > 0 ? "mt-4" : undefined;
                if (!hit) {
                  return (
                    <p
                      key={block.id}
                      id={`b-${block.id}`}
                      data-bid={block.id}
                      className={paragraphClass}
                    >
                      {block.text}
                    </p>
                  );
                }

                const color = ROLE_COLOR[hit.f.role] ?? "currentColor";
                const isActive = active === hit.cardIdx;
                return (
                  <p
                    key={block.id}
                    id={`b-${block.id}`}
                    data-bid={block.id}
                    className={paragraphClass}
                  >
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
                      {block.text}
                    </mark>
                  </p>
                );
              })}
            </article>
          </div>

          <aside
            className="relative flex flex-col gap-3 lg:gap-0 lg:block lg:min-h-[var(--aside-min-h)]"
            style={{ "--aside-min-h": `${asideMinHeight}px` } as React.CSSProperties}
          >
            {selectedSection?.isReferences ? (
              <div className="text-sm leading-relaxed text-muted bg-paper border border-rule rounded-lg p-5">
                {t.explain_references_note}
              </div>
            ) : visibleOrdered.length === 0 ? (
              <div className="text-sm text-muted bg-paper border border-rule rounded-lg p-6">
                {t.explain_empty}
              </div>
            ) : (
              visibleOrdered.map(({ f, cardIdx }) => {
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
      </section>

      <p className="text-xs text-muted mt-2">{t.explain_footer(model)}</p>
    </div>
  );
}
