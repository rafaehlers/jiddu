"use client";

import { Fragment, type ReactNode, useMemo } from "react";
import type { Block } from "@/lib/paragraphs";
import type { Sentence } from "@/lib/schema";

type Props = {
  text: string;
  blocks: Block[];
  sentences: Sentence[];
  renderSentence: (sentence: Sentence) => ReactNode;
  variant?: "screen" | "print";
};

type Segment =
  | { type: "text"; text: string }
  | { type: "sentence"; sentence: Sentence };

type ReaderBlock = Block & { segments: Segment[] };

/** Shared structured-paper renderer for every sentence-based analysis. */
export function StructuredDocumentText({
  text,
  blocks,
  sentences,
  renderSentence,
  variant = "screen",
}: Props) {
  const readerBlocks = useMemo(
    () => buildReaderBlocks(text, blocks, sentences),
    [blocks, sentences, text],
  );
  const contentBlocks = readerBlocks.filter(
    (block) => (block.kind ?? "content") === "content",
  );
  const referenceBlocks = readerBlocks.filter(
    (block) => block.kind === "references",
  );

  return (
    <div className={variant === "screen" ? "document-reader" : "print-document-reader"}>
      <BlockList
        blocks={contentBlocks}
        renderSentence={renderSentence}
        variant={variant}
      />
      {referenceBlocks.length > 0 &&
        (variant === "print" ? (
          <section className="print-document-references">
            <h3>{referenceTitle(referenceBlocks)}</h3>
            <BlockList
              blocks={referenceBlocks}
              renderSentence={renderSentence}
              variant={variant}
              headings={false}
            />
          </section>
        ) : (
          <details className="mt-8 border-t border-rule pt-4">
            <summary className="cursor-pointer select-none font-sans text-sm font-medium text-muted hover:text-foreground">
              {referenceTitle(referenceBlocks)}
            </summary>
            <div className="mt-4 pl-3 border-l border-rule text-[0.92em] text-ink/80">
              <BlockList
                blocks={referenceBlocks}
                renderSentence={renderSentence}
                variant={variant}
                headings={false}
              />
            </div>
          </details>
        ))}
    </div>
  );
}

function BlockList({
  blocks,
  renderSentence,
  variant,
  headings = true,
}: {
  blocks: ReaderBlock[];
  renderSentence: (sentence: Sentence) => ReactNode;
  variant: "screen" | "print";
  headings?: boolean;
}) {
  let previousSection: string | null = null;
  return blocks.map((block) => {
    const sectionKey = block.sectionId ?? block.section ?? null;
    const showHeading =
      headings && Boolean(block.section) && sectionKey !== previousSection;
    previousSection = sectionKey;
    return (
      <Fragment key={block.id}>
        {showHeading && (
          <SectionHeading
            level={block.sectionLevel}
            title={block.section!}
            variant={variant}
          />
        )}
        <p
          data-block-id={block.id}
          className={
            variant === "screen"
              ? "mb-5 last:mb-0 text-pretty"
              : "print-document-paragraph"
          }
        >
          {block.segments.map((segment, index) =>
            segment.type === "sentence" ? (
              <Fragment key={segment.sentence.id}>
                {renderSentence(segment.sentence)}
              </Fragment>
            ) : (
              <Fragment key={`text-${index}`}>{segment.text}</Fragment>
            ),
          )}
        </p>
      </Fragment>
    );
  });
}

function SectionHeading({
  level = 1,
  title,
  variant,
}: {
  level?: number;
  title: string;
  variant: "screen" | "print";
}) {
  if (variant === "print") {
    return <h3 className="print-document-heading">{title}</h3>;
  }
  if (level <= 1) {
    return (
      <h2 className="mt-8 first:mt-0 mb-4 pb-2 border-b border-rule font-sans text-xs font-semibold uppercase tracking-[0.08em] text-muted">
        {title}
      </h2>
    );
  }
  return (
    <h3 className="mt-7 mb-3 font-serif text-lg font-semibold leading-snug text-ink">
      {title}
    </h3>
  );
}

function buildReaderBlocks(
  text: string,
  blocks: Block[],
  sentences: Sentence[],
): ReaderBlock[] {
  const sourceBlocks =
    blocks.length > 0
      ? blocks
      : [
          {
            id: "document",
            start: 0,
            end: text.length,
            text,
            kind: "content" as const,
          },
        ];
  return sourceBlocks.map((block) => ({
    ...block,
    segments: segmentsForBlock(block, sentences),
  }));
}

function segmentsForBlock(block: Block, sentences: Sentence[]): Segment[] {
  const matches = sentences.filter(
    (sentence) => sentence.start >= block.start && sentence.end <= block.end,
  );
  if (matches.length === 0) return [{ type: "text", text: block.text }];

  const segments: Segment[] = [];
  let cursor = 0;
  for (const sentence of matches) {
    const localStart = Math.max(0, sentence.start - block.start);
    const localEnd = Math.min(block.text.length, sentence.end - block.start);
    if (localStart > cursor) {
      segments.push({
        type: "text",
        text: normalizeInlineGap(block.text.slice(cursor, localStart)),
      });
    }
    segments.push({ type: "sentence", sentence });
    cursor = Math.max(cursor, localEnd);
  }
  if (cursor < block.text.length) {
    segments.push({
      type: "text",
      text: normalizeInlineGap(block.text.slice(cursor)),
    });
  }
  return segments;
}

function normalizeInlineGap(value: string): string {
  return value.replace(/\s+/g, " ");
}

function referenceTitle(blocks: ReaderBlock[]): string {
  return blocks.find((block) => block.section)?.section ?? "References";
}
