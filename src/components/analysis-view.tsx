"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FALLACY_BY_ID } from "@/lib/fallacies";
import type { Finding, Sentence } from "@/lib/schema";
import { cn } from "@/lib/utils";

type Props = {
  title: string | null;
  sourceRef: string | null;
  source: string;
  text: string;
  sentences: Sentence[];
  findings: Finding[];
  score: number;
  summary: string;
  provider: string;
  model: string;
};

type FindingWithKey = Finding & { key: string };

export function AnalysisView({
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
  const keyedFindings: FindingWithKey[] = useMemo(
    () => findings.map((f, i) => ({ ...f, key: `f${i}` })),
    [findings],
  );

  // Map sentenceId → list of findings on that sentence (highest severity wins styling).
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
  const textColRef = useRef<HTMLDivElement>(null);
  const commentsColRef = useRef<HTMLDivElement>(null);
  const commentRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const [commentOffsets, setCommentOffsets] = useState<Map<string, number>>(new Map());
  const [asideMinHeight, setAsideMinHeight] = useState<number>(0);

  const measure = () => {
    if (!textColRef.current) return;
    const container = textColRef.current;
    const containerTop = container.getBoundingClientRect().top;

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
    let cursor = 0;
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
    const node = commentRefs.current.get(f.key);
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Render text by sentence, preserving the gaps in between (whitespace/newlines).
  const segments = useMemo(() => buildSegments(text, sentences), [text, sentences]);

  return (
    <div className="flex-1 flex flex-col">
      <div className="mx-auto max-w-7xl w-full px-6 py-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4 justify-between">
          <div className="flex flex-col gap-1 min-w-0">
            <h1 className="font-serif text-2xl md:text-3xl tracking-tight truncate">
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
          <ScoreBadge score={score} />
        </div>
        {summary && (
          <p className="text-foreground/90 text-base max-w-3xl">{summary}</p>
        )}
        <p className="text-xs text-muted">
          {provider} · {model} · {keyedFindings.length} finding
          {keyedFindings.length === 1 ? "" : "s"} across {sentences.length} sentences
        </p>
      </div>

      <div className="mx-auto max-w-7xl w-full px-6 pb-16 grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-8">
        <article
          ref={textColRef}
          className="bg-paper border border-rule rounded-lg p-8 font-serif text-lg leading-[1.75] text-ink"
        >
          {segments.map((seg, i) => {
            if (seg.type === "gap") {
              // Preserve paragraph breaks.
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
            const severity = highestSeverity(fs);
            const isActive = fs.some((f) => f.key === active);
            return (
              <mark
                key={s.id}
                data-sid={s.id}
                data-severity={severity}
                data-active={isActive ? "true" : undefined}
                className="fallacy"
                onClick={() => focusSentence(s.id)}
                title={fs.map((f) => FALLACY_BY_ID[f.fallacy]?.namePt ?? f.fallacy).join(", ")}
              >
                {s.text}
              </mark>
            );
          })}
          {keyedFindings.length === 0 && (
            <p className="mt-6 text-sm text-muted italic">No fallacies detected.</p>
          )}
        </article>

        <aside
          ref={commentsColRef}
          className="relative"
          style={{ minHeight: asideMinHeight }}
        >
          {keyedFindings.map((f) => {
            const def = FALLACY_BY_ID[f.fallacy];
            const offset = commentOffsets.get(f.key) ?? 0;
            return (
              <div
                key={f.key}
                ref={(el) => {
                  commentRefs.current.set(f.key, el);
                }}
                onClick={() => focusFinding(f.key)}
                className={cn(
                  "absolute left-0 right-0 cursor-pointer",
                  "bg-paper border border-rule rounded-md p-3 shadow-sm",
                  "transition-all hover:border-foreground",
                  active === f.key && "border-foreground ring-2 ring-[var(--severity-medium)]/40",
                )}
                style={{ top: `${offset}px` }}
                data-severity={f.severity}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        f.severity === "high"
                          ? "var(--severity-high)"
                          : f.severity === "medium"
                            ? "var(--severity-medium)"
                            : "var(--severity-low)",
                    }}
                  />
                  <span className="font-medium text-sm">
                    {def?.namePt ?? f.fallacy}
                  </span>
                  <span className="text-xs text-muted ml-auto uppercase tracking-wide">
                    {f.severity}
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
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 61
      ? "var(--severity-high)"
      : score >= 36
        ? "var(--severity-medium)"
        : "var(--severity-low)";
  const label =
    score >= 81
      ? "propagandistic"
      : score >= 61
        ? "highly fallacious"
        : score >= 36
          ? "several fallacies"
          : score >= 16
            ? "minor issues"
            : "clean reasoning";
  return (
    <div className="flex items-center gap-3 bg-paper border border-rule rounded-lg px-4 py-3">
      <div
        className="font-serif text-3xl font-semibold tabular-nums"
        style={{ color: tone }}
      >
        {score}
        <span className="text-base text-muted">/100</span>
      </div>
      <div className="text-xs text-muted uppercase tracking-wide">{label}</div>
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

function highestSeverity(fs: FindingWithKey[]): "low" | "medium" | "high" {
  if (fs.some((f) => f.severity === "high")) return "high";
  if (fs.some((f) => f.severity === "medium")) return "medium";
  return "low";
}
