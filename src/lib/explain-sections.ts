import type { ExplainFinding } from "./explain-schema";
import { isReferencesHeading, type Block } from "./paragraphs";

export type ExplainSection = {
  id: string;
  title: string | null;
  blocks: Block[];
  isReferences: boolean;
  isMetadata: boolean;
  level: number;
  parent: string | null;
  path: string[];
};

export function isReferenceBlock(block: Block): boolean {
  return block.kind === "references" || isReferencesHeading(block.section);
}

export function getExplainableBlocks(blocks: Block[]): Block[] {
  return blocks.filter(
    (block) => !isReferenceBlock(block) && block.kind !== "metadata",
  );
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
    const isMetadata = block.kind === "metadata";
    const structuralId = block.sectionId?.trim() || null;
    const previous = sections[sections.length - 1];

    if (
      !previous ||
      (structuralId
        ? previous.id !== structuralId
        : previous.title !== title ||
          previous.isReferences !== isReferences ||
          previous.isMetadata !== isMetadata)
    ) {
      sections.push({
        id: structuralId ?? `section-${sections.length}`,
        title,
        blocks: [block],
        isReferences,
        isMetadata,
        level: block.sectionLevel ?? 1,
        parent: block.sectionParent?.trim() || null,
        path: block.sectionPath?.filter(Boolean) ?? (title ? [title] : []),
      });
      continue;
    }

    previous.blocks.push(block);
  }

  return sections;
}
