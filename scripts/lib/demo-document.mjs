/**
 * Reflows curated demo sentences into the same persisted structural contract
 * produced by academic PDF extraction: clean paragraphs plus section metadata.
 */
export function structureDemoDocument(sentences, sectionTitles) {
  if (sentences.length === 0) {
    return { text: "", blocks: [], sentences: [] };
  }

  const sectionCount = Math.min(sectionTitles.length, sentences.length);
  const groups = distribute(sentences, sectionCount);
  const textParts = [];
  const blocks = [];
  const structuredSentences = [];
  let offset = 0;

  groups.forEach((group, sectionIndex) => {
    const blockText = group.map((sentence) => sentence.text).join(" ");
    const blockStart = offset;
    const blockEnd = blockStart + blockText.length;
    const section = sectionTitles[sectionIndex];

    blocks.push({
      id: `b${sectionIndex}`,
      start: blockStart,
      end: blockEnd,
      text: blockText,
      section,
      kind: "content",
      sectionId: `section-${sectionIndex + 1}`,
      sectionLevel: 1,
      sectionParent: null,
      sectionPath: [section],
      analysisUnit: "section",
    });

    let sentenceOffset = blockStart;
    for (const sentence of group) {
      const start = sentenceOffset;
      const end = start + sentence.text.length;
      structuredSentences.push({
        id: `s${structuredSentences.length}`,
        start,
        end,
        text: sentence.text,
      });
      sentenceOffset = end + 1;
    }

    textParts.push(blockText);
    offset = blockEnd + 2;
  });

  return {
    text: textParts.join("\n\n"),
    blocks,
    sentences: structuredSentences,
  };
}

function distribute(values, groupCount) {
  const groups = [];
  let cursor = 0;
  for (let index = 0; index < groupCount; index++) {
    const remaining = values.length - cursor;
    const slots = groupCount - index;
    const size = Math.ceil(remaining / slots);
    groups.push(values.slice(cursor, cursor + size));
    cursor += size;
  }
  return groups;
}
