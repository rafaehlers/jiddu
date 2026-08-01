import type { ExplainFinding } from "./explain-schema";
import { isReferencesHeading, type Block } from "./paragraphs";

export type ExplainSection = {
  id: string;
  title: string | null;
  blocks: Block[];
  isReferences: boolean;
};

export function isReferenceBlock(block: Block): boolean {
  return block.kind === "references" || isReferencesHeading(block.section);
}

export function getExplainableBlocks(blocks: Block[]): Block[] {
  return blocks.filter((block) => !isReferenceBlock(block));
}

export function getExplainableFindings(
  findings: ExplainFinding[],
  blocks: Block[],
): ExplainFinding[] {
  const validBlockIds = new Set(getExplainableBlocks(blocks).map((block) => block.id));
  return findings
    .map((finding) => ({
      ...finding,
      blockIds: finding.blockIds.filter((id) => validBlockIds.has(id)),
    }))
    .filter((finding) => finding.blockIds.length > 0);
}

export function groupExplainSections(blocks: Block[]): ExplainSection[] {
  const sections: ExplainSection[] = [];

  for (const block of blocks) {
    const title = block.section?.trim() || null;
    const isReferences = isReferenceBlock(block);
    const previous = sections[sections.length - 1];

    if (
      !previous ||
      previous.title !== title ||
      previous.isReferences !== isReferences
    ) {
      sections.push({
        id: `section-${sections.length}`,
        title,
        blocks: [block],
        isReferences,
      });
      continue;
    }

    previous.blocks.push(block);
  }

  return sections;
}
