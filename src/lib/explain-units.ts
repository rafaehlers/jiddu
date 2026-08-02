import type { ExplainFinding } from "./explain-schema";
import type { Block } from "./paragraphs";

export type ExplainInputSection = {
  id: string;
  title: string | null;
  level: number;
  parent: string | null;
  path: string[];
  blocks: Block[];
  chars: number;
};

export type ExplainSectionChunk = {
  index: number;
  sections: ExplainInputSection[];
  chars: number;
};

/** Keep semantic sections separate from technical model chunks. */
export function buildExplainInputSections(blocks: Block[]): ExplainInputSection[] {
  const sections: ExplainInputSection[] = [];
  let legacySectionSerial = 0;

  for (const block of blocks) {
    const previous = sections.at(-1);
    const structuralId = block.sectionId?.trim() || null;
    const canJoinPrevious = structuralId
      ? previous?.id === structuralId
      : Boolean(block.section && previous?.title === block.section);

    if (previous && canJoinPrevious) {
      previous.blocks.push(block);
      previous.chars += block.text.length;
      continue;
    }

    sections.push({
      id:
        structuralId ??
        (block.section
          ? `legacy-section-${legacySectionSerial++}`
          : `legacy-block-${block.id}`),
      title: block.section?.trim() || null,
      level: block.sectionLevel ?? 1,
      parent: block.sectionParent?.trim() || null,
      path: block.sectionPath?.filter(Boolean) ??
        (block.section ? [block.section] : []),
      blocks: [block],
      chars: block.text.length,
    });
  }
  return sections;
}

/** Preserve the public API's historical one-output-per-paragraph contract. */
export function buildParagraphExplainInputSections(
  blocks: Block[],
): ExplainInputSection[] {
  return blocks.map((block) => ({
    id: `paragraph-${block.id}`,
    title: block.section?.trim() || null,
    level: block.sectionLevel ?? 1,
    parent: block.sectionParent?.trim() || null,
    path: block.sectionPath?.filter(Boolean) ??
      (block.section ? [block.section] : []),
    blocks: [block],
    chars: block.text.length,
  }));
}

/**
 * Apply the persisted-text ceiling to structured PDFs too. Full blocks are
 * preferred so the cap never creates a routine mid-paragraph split; only a
 * single pathological first block is shortened as a last-resort safeguard.
 */
export function capExplainBlocks(blocks: Block[], maxChars: number): Block[] {
  if (maxChars <= 0) return [];
  const capped: Block[] = [];
  let chars = 0;
  for (const block of blocks) {
    const separator = capped.length > 0 ? 2 : 0;
    if (chars + separator + block.text.length <= maxChars) {
      capped.push(block);
      chars += separator + block.text.length;
      continue;
    }
    if (capped.length > 0) break;

    const available = maxChars - separator;
    const raw = block.text.slice(0, available);
    const sentenceBoundary = Math.max(
      raw.lastIndexOf(". "),
      raw.lastIndexOf("? "),
      raw.lastIndexOf("! "),
    );
    const wordBoundary = raw.lastIndexOf(" ");
    const cut =
      sentenceBoundary >= available * 0.65
        ? sentenceBoundary + 1
        : wordBoundary >= available * 0.8
          ? wordBoundary
          : raw.length;
    const text = raw.slice(0, cut).trim();
    if (text) capped.push({ ...block, text, end: block.start + text.length });
    break;
  }
  return capped;
}

/** Pack complete sections up to the target. A large section remains whole. */
export function chunkExplainSections(
  sections: ExplainInputSection[],
  opts?: { target?: number; minToSplit?: number },
): ExplainSectionChunk[] {
  const target = opts?.target ?? 18_000;
  const minToSplit = opts?.minToSplit ?? 24_000;
  const totalChars = sections.reduce((sum, section) => sum + section.chars, 0);
  if (totalChars <= minToSplit) {
    return [{ index: 0, sections, chars: totalChars }];
  }

  const chunks: ExplainSectionChunk[] = [];
  let current: ExplainInputSection[] = [];
  let currentChars = 0;
  for (const section of sections) {
    if (current.length > 0 && currentChars + section.chars > target) {
      chunks.push({ index: chunks.length, sections: current, chars: currentChars });
      current = [];
      currentChars = 0;
    }
    current.push(section);
    currentChars += section.chars;
  }
  if (current.length > 0) {
    chunks.push({ index: chunks.length, sections: current, chars: currentChars });
  }
  return chunks;
}

export function normalizeFindingForSections(
  finding: ExplainFinding,
  sections: ExplainInputSection[],
  usedSectionIds?: Set<string>,
): ExplainFinding | null {
  const sectionByBlock = new Map<string, ExplainInputSection>();
  for (const section of sections) {
    for (const block of section.blocks) sectionByBlock.set(block.id, section);
  }
  const section = finding.blockIds
    .map((blockId) => sectionByBlock.get(blockId))
    .find(Boolean);
  if (!section || usedSectionIds?.has(section.id)) return null;
  usedSectionIds?.add(section.id);
  return {
    ...finding,
    // The model may cite only the first paragraph. Persist the complete
    // section so navigation, highlighting and the paper map share one unit.
    blockIds: section.blocks.map((block) => block.id),
  };
}

export function normalizeFindingsForSections(
  findings: ExplainFinding[],
  sections: ExplainInputSection[],
): ExplainFinding[] {
  const used = new Set<string>();
  return findings
    .map((finding) => normalizeFindingForSections(finding, sections, used))
    .filter((finding): finding is ExplainFinding => finding !== null);
}
