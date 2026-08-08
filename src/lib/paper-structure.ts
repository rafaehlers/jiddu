import type {
  IngestedDocument,
  IngestedPage,
  IngestedTextItem,
} from "./ingest/url";
import {
  splitBlocks,
  splitInlineReferencesHeading,
  type Block,
  type BlockKind,
} from "./paragraphs";

type HeadingCandidate = {
  text: string;
  level: number;
  /** The font that actually produced the heading in the PDF text layer. */
  fontName?: string;
};

type PaperParagraph = {
  text: string;
  pageStart: number;
  pageEnd: number;
};

type PaperSection = {
  id: string;
  title: string;
  level: number;
  parent: string | null;
  path: string[];
  kind: BlockKind;
  paragraphs: PaperParagraph[];
};

const TOP_LEVEL_HEADING = /^(?:\d+(?:\.\d+)*\.?\s+)?(?:abstract|resumo|resumen|introduction|introdu[cç][aã]o|introducci[oó]n|background|antecedentes|overview|motivation|motiva[cç][aã]o|motivaci[oó]n|problem statement|theoretical framework|referencial te[oó]rico|marco te[oó]rico|related works?|literature review|revis[aã]o da literatura|revisi[oó]n de la literatura|methods?|methodology|materials and methods|m[eé]todos?|metodologia|material(?:es)? y m[eé]todos|results?|findings|resultados?|achados|discussion|discuss[aã]o|discusi[oó]n|conclusions?|conclus[aã]o|conclusiones?|limitations?|limita[cç][oõ]es|limitaciones|references|bibliography|refer[eê]ncias|referencias|bibliograf[ií]a|acknowledg(?:e)?ments?|agradecimentos?|agradecimientos?|appendix|ap[eê]ndice|ap[eé]ndices|supplementary materials?|material suplementar|materiales suplementarios|declaration of interest|declara[cç][aã]o de interesses?|declaraci[oó]n de intereses|conflicts? of interest|conflitos? de interesses?|conflictos? de intereses)$/i;

const SUBSECTION_HEADING = /^(?:\d+(?:\.\d+)*\.?\s+)?(?:search|busca|b[uú]squeda|screening|triagem|cribado|selection|sele[cç][aã]o|selecci[oó]n|eligibility|elegibilidade|elegibilidad|inclusion|inclus[aã]o|inclusi[oó]n|exclusion|exclus[aã]o|exclusi[oó]n|quality|qualidade|calidad|critical|cr[ií]tic[ao]|hierarchy|hierarquia|jerarqu[ií]a|methodological|metodol[oó]gic[ao]|data|dados|datos|outcome|desfecho|resultado|patient|paciente|participant|participante|sample|amostra|muestra|population|popula[cç][aã]o|poblaci[oó]n|intervention|interven[cç][aã]o|intervenci[oó]n|treatment|tratamento|tratamiento|procedure|procedimento|procedimiento|protocol|protocolo|measure|measurement|medida|medi[cç][aã]o|medici[oó]n|educational|educacional|content|conte[uú]do|contenido|delivery|aplica[cç][aã]o|format|formato|tool|ferramenta|herramienta|duration|dura[cç][aã]o|duraci[oó]n|frequency|frequ[eê]ncia|frecuencia|professional|profissional|profesional|effectiveness|efetividade|efectividad|efficacy|efic[aá]cia|pne addressing|outcomes? related|naming|nomenclatura|statistical|estat[ií]stic[ao]|sensitivity|sensibilidade|sensibilidad|subgroup|subgrupo|risk of bias|risco de vi[eé]s|riesgo de sesgo|strength|for[cç]a|fortaleza|limitation|limita[cç][aã]o|limitaci[oó]n|future direction|dire[cç][oõ]es futuras|direcciones futuras|implication|implica[cç][aã]o|implicaci[oó]n)\b[^.!?;,]*$/i;

const EXCLUDED_HEADING = /^(?:article history|hist[oó]rico do artigo|historial del art[ií]culo|keywords?|palavras-chave|palabras clave|contact\b|contato\b|contacto\b|review$|revis[aã]o$|revisi[oó]n$|doi\b|copyright|correspondence|correspond[eê]ncia|correspondencia|author information|informa[cç][oõ]es dos autores|informaci[oó]n de autores)/i;
const METADATA_HEADING = /^(?:declaration of interest|declara[cç][aã]o de interesses?|declaraci[oó]n de intereses|conflicts? of interest|conflitos? de interesses?|conflictos? de intereses|acknowledg(?:e)?ments?|agradecimentos?|agradecimientos?)$/i;
const REFERENCES_HEADING = /^(?:references|bibliography|works cited|literature cited|refer[eê]ncias|referencias|bibliograf[ií]a)$/i;

const TABLE_CAPTION = /^(?:table|figure|fig\.)\s+[A-Z]?\d+[.:]?\b/i;
const INLINE_LABEL = /^[A-Z][A-Za-z -]{1,35}:\s+\S/;
const TERMINAL = /[.!?][\])}"'’”]*$/;

/**
 * Build the units shown and explained by the paper reader.
 *
 * Academic PDFs get a layout-aware pass over LiteParse text metadata. Other
 * sources keep the existing conservative text splitter. This separation is
 * deliberate: a PDF page/column break is layout, never a semantic boundary.
 */
export function splitExplainDocument(doc: IngestedDocument): Block[] {
  if (doc.source === "url" && doc.editorial?.blocks.length) {
    const structured = splitEditorialArticle(doc);
    if (structured.length > 0) return structured;
  }
  if (
    doc.source === "pdf" &&
    doc.pages?.some((page) => (page.textItems?.length ?? 0) > 0)
  ) {
    const structured = splitAcademicPdf(doc.pages);
    const contentSections = new Set(
      structured
        .filter((block) => block.kind === "content")
        .map((block) => block.sectionId),
    );
    const structuredChars = structured.reduce(
      (sum, block) => sum + block.text.length,
      0,
    );
    const rawChars = doc.pages.reduce(
      (sum, page) => sum + (page.markdown || page.text).length,
      0,
    );
    const hasUsefulCoverage =
      structuredChars >= Math.min(1_500, rawChars * 0.35) &&
      (rawChars === 0 || structuredChars / rawChars >= 0.18);
    // A single accidental title is not enough evidence to replace the safe
    // legacy path. Real papers normally expose at least Abstract/Introduction
    // plus one later section.
    if (contentSections.size >= 2 && hasUsefulCoverage) return structured;
  }
  return splitBlocks(doc.text);
}

function splitEditorialArticle(doc: IngestedDocument): Block[] {
  const sourceBlocks = doc.editorial?.blocks ?? [];
  const blocks: Block[] = [];
  let currentSection: string | null = null;
  let currentSectionLevel = 1;
  let currentSectionId: string | null = null;
  let sectionSerial = 0;
  let offset = 0;

  for (const source of sourceBlocks) {
    if (source.kind === "heading") {
      currentSection = source.text;
      currentSectionLevel = source.level ?? 1;
      currentSectionId = `web-section-${sectionSerial++}`;
      continue;
    }

    const text = source.text.trim();
    if (!text) continue;
    const start = offset;
    const end = start + text.length;
    offset = end + 2;
    const section = source.section ?? currentSection;
    const sectionLevel = source.sectionLevel ?? currentSectionLevel;
    blocks.push({
      id: `web-block-${blocks.length}`,
      start,
      end,
      text,
      section,
      kind: "content",
      sectionId: section ? currentSectionId : null,
      sectionLevel,
      sectionPath: section ? [section] : [],
      analysisUnit: section ? "section" : "paragraph",
      editorialKind: source.kind,
      containsQuotation: containsQuotation(text),
      quoteAttribution: source.quoteAttribution ?? null,
    });
  }

  if (blocks[0] && doc.editorial?.metadata) {
    blocks[0].documentMetadata = doc.editorial.metadata;
  }

  return blocks;
}

function containsQuotation(text: string): boolean {
  return /(?:“[^”]{2,}”|"[^"]{2,}"|‘[^’]{2,}’|'[^']{2,}')/.test(text);
}

export function splitAcademicPdf(pages: IngestedPage[]): Block[] {
  const headingCandidates = collectHeadingCandidates(pages);
  const furniture = collectRunningFurniture(pages);
  const sections: PaperSection[] = [];
  const headingStack: string[] = [];
  let current: PaperSection | null = null;

  for (const page of pages) {
    const pageCandidates = headingCandidates.get(page.pageNumber) ?? [];
    const paragraphStarts = collectParagraphStarts(page, pageCandidates);
    const rawChunks = hasNarrativeColumns(page)
      ? reconstructLayoutChunks(page, pageCandidates)
      : (page.markdown || page.text)
          .replace(/\r\n/g, "\n")
          .replace(/!\[[^\]]*\]\([^\n)]+\)/g, " ")
          .split(/\n\s*\n+/);
    let insideFloat = false;

    for (const rawChunk of rawChunks) {
      let chunk = cleanFurniturePrefix(rawChunk, furniture);
      if (!chunk) continue;

      // A PDF formatter can fuse several typographic headings and the first
      // paragraph into one Markdown line. Peel every real heading from the
      // front before considering the remaining prose.
      let matchedHeading = false;
      while (true) {
        const match = headingAtStart(chunk, pageCandidates);
        if (!match) break;
        matchedHeading = true;
        insideFloat = false;
        chunk = chunk.slice(match.text.length).trim();
        // Before Abstract/Introduction, an accent-coloured article title is
        // still front matter, not a paper section.
        if (
          !current &&
          !TOP_LEVEL_HEADING.test(match.text) &&
          !/^\d+(?:\.\d+)*\.?\s+/.test(match.text)
        ) {
          continue;
        }
        current = beginSection(sections, headingStack, match);
      }

      if (!matchedHeading) {
        const inlineReferences = splitInlineReferencesHeading(chunk);
        if (inlineReferences) {
          matchedHeading = true;
          insideFloat = false;
          current = beginSection(sections, headingStack, {
            text: inlineReferences.heading,
            level: 1,
          });
          chunk = inlineReferences.remainder;
        }
      }

      if (!current) continue; // title, authors, affiliations and journal chrome

      if (/^(?:article history|keywords?)\b/i.test(chunk)) continue;
      if (TABLE_CAPTION.test(chunk)) {
        insideFloat = true;
        continue;
      }
      if (isMarkdownTable(chunk)) continue;
      if (looksLikeFigureDebris(chunk)) continue;
      if (insideFloat) {
        if (!looksLikeNarrativeResume(chunk)) continue;
        insideFloat = false;
      }
      if (matchedHeading && !chunk) continue;

      for (const paragraph of coherentParagraphs(chunk, paragraphStarts)) {
        appendParagraph(current, paragraph, page.pageNumber);
      }
    }
  }

  return protectReferenceTail(sectionsToBlocks(sections));
}

function collectHeadingCandidates(
  pages: IngestedPage[],
): Map<number, HeadingCandidate[]> {
  const all = pages.flatMap((page) =>
    (page.textItems ?? []).map((item) => ({ page, item })),
  );
  const colorCounts = new Map<string, number>();
  for (const { item } of all) {
    const color = normalizeColor(item.fillColor);
    if (color) colorCounts.set(color, (colorCounts.get(color) ?? 0) + 1);
  }
  const bodyColor = [...colorCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const bodyHeights = all
    .filter(({ item }) => normalizeColor(item.fillColor) === bodyColor)
    .map(({ item }) => item.fontHeight ?? item.height)
    .filter((height) => Number.isFinite(height) && height > 0)
    .sort((a, b) => a - b);
  const bodyHeight = bodyHeights[Math.floor(bodyHeights.length / 2)] ?? 0;

  const topFonts = new Set<string>();
  const subsectionFonts = new Set<string>();
  for (const { page, item } of all) {
    const text = normalizeText(item.text);
    if (!looksLikeHeadingText(text) || !isLineStart(page, item)) continue;
    if (!isLineIsolated(page, item)) continue;
    if (
      TOP_LEVEL_HEADING.test(text) &&
      (hasHeadingStyle(item) ||
        isAccent(item, bodyColor) ||
        (item.fontHeight ?? item.height) > bodyHeight * 1.08) &&
      item.fontName
    ) {
      topFonts.add(item.fontName);
    }
    if (
      SUBSECTION_HEADING.test(text) &&
      (hasHeadingStyle(item) || isAccent(item, bodyColor)) &&
      item.fontName
    ) {
      subsectionFonts.add(item.fontName);
    }
  }

  const result = new Map<number, HeadingCandidate[]>();
  for (const { page, item } of all) {
    const text = normalizeText(item.text);
    if (!looksLikeHeadingText(text) || !isLineStart(page, item)) continue;

    const topLevel = TOP_LEVEL_HEADING.test(text);
    const knownSubsection = SUBSECTION_HEADING.test(text);
    const seededFont =
      Boolean(item.fontName) &&
      (topFonts.has(item.fontName!) || subsectionFonts.has(item.fontName!));
    const accent = isAccent(item, bodyColor);
    const isolated = isLineIsolated(page, item);
    const strongStyle = seededFont || accent || hasHeadingStyle(item);

    if (isTableDominantPage(page) && !topLevel) continue;

    if (
      !(
        (topLevel && strongStyle && (isolated || seededFont || accent)) ||
        (knownSubsection && strongStyle && (isolated || seededFont || accent)) ||
        (seededFont && (isolated || accent)) ||
        (accent && isolated)
      )
    ) {
      continue;
    }

    const level = headingLevel(text, item, topFonts);
    const list = result.get(page.pageNumber) ?? [];
    if (!list.some((candidate) => candidate.text.toLowerCase() === text.toLowerCase())) {
      list.push({ text, level, fontName: item.fontName });
      result.set(page.pageNumber, list);
    }
  }
  return result;
}

type LayoutLine = {
  x: number;
  y: number;
  fontName: string;
  text: string;
  column: "left" | "right";
};

function hasNarrativeColumns(page: IngestedPage): boolean {
  // Reordering the complete text layer is useful for ordinary two-column
  // prose, but unsafe on pages that also contain a real table. LiteParse's
  // Markdown already isolates table rows, while a bbox-only pass would mix
  // their cells and figure labels back into the surrounding section.
  if (
    page.pageNumber <= 1 ||
    isTableDominantPage(page) ||
    hasSubstantialMarkdownTable(page)
  ) {
    return false;
  }
  const width = page.width ?? 612;
  const height = page.height ?? 792;
  const narrative = (page.textItems ?? []).filter((item) => {
    const rotation = Math.abs(item.rotation ?? 0) % 180;
    const fontHeight = item.fontHeight ?? item.height;
    return (
      (rotation < 2 || rotation > 178) &&
      item.y > height * 0.04 &&
      item.y + item.height < height * 0.97 &&
      fontHeight >= 8
    );
  });
  const left = narrative.filter((item) => item.x < width / 2).length;
  const right = narrative.filter((item) => item.x >= width / 2).length;
  return left >= 18 && right >= 18;
}

function reconstructLayoutChunks(
  page: IngestedPage,
  headings: HeadingCandidate[],
): string[] {
  const width = page.width ?? 612;
  const height = page.height ?? 792;
  const items = (page.textItems ?? []).filter((item) => {
    const rotation = Math.abs(item.rotation ?? 0) % 180;
    return (
      (rotation < 2 || rotation > 178) &&
      item.y > height * 0.04 &&
      item.y + item.height < height * 0.97 &&
      item.x > width * 0.05 &&
      item.x + item.width < width * 0.97
    );
  });
  const lines: LayoutLine[] = [];

  for (const column of ["left", "right"] as const) {
    const columnItems = items
      .filter((item) => (item.x >= width / 2 ? "right" : "left") === column)
      .sort((a, b) => a.y - b.y || a.x - b.x);
    const grouped: Array<{ y: number; items: IngestedTextItem[] }> = [];
    for (const item of columnItems) {
      let line = grouped.find((candidate) => Math.abs(candidate.y - item.y) <= 3.2);
      if (!line) {
        line = { y: item.y, items: [] };
        grouped.push(line);
      }
      line.items.push(item);
    }
    for (const line of grouped.sort((a, b) => a.y - b.y)) {
      line.items.sort((a, b) => a.x - b.x);
      const first = line.items[0];
      const text = line.items
        .map((item) => item.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (!text) continue;
      if (
        line.y > height * 0.92 &&
        /^(?:[©\s]*\d+[©\s]*|copyright.*)$/i.test(text)
      ) {
        continue;
      }
      lines.push({
        x: first.x,
        y: line.y,
        fontName: first.fontName ?? "",
        text,
        column,
      });
    }
  }

  const baselineByKey = new Map<string, number>();
  for (const line of lines) {
    const key = `${line.fontName}|${line.column}`;
    const current = baselineByKey.get(key);
    if (current === undefined || line.x < current) baselineByKey.set(key, line.x);
  }

  const chunks: string[] = [];
  let current = "";
  const flush = () => {
    const text = normalizeText(current)
      .replace(/(-?\d+)\s+\.(\d+)/g, "$1.$2")
      .replace(/\b([A-Z]{2,})-\s+(\d)/g, "$1-$2");
    if (text) chunks.push(text);
    current = "";
  };
  for (const line of lines) {
    const heading = headingAtLayoutLine(line, headings);
    const baseline = baselineByKey.get(`${line.fontName}|${line.column}`) ?? line.x;
    const indent = line.x - baseline;
    const paragraphStart =
      !heading &&
      indent >= 7 &&
      indent <= 30 &&
      (/^[A-ZÀ-Ý]/.test(line.text) || /^\(?\d+[.)]\s/.test(line.text));
    if (heading || paragraphStart) flush();
    current = joinLayoutLine(current, line.text);
    if (heading) flush();
  }
  flush();
  return chunks;
}

function headingAtLayoutLine(
  line: LayoutLine,
  candidates: HeadingCandidate[],
): HeadingCandidate | null {
  const candidate = headingAtStart(line.text, candidates);
  if (!candidate) return null;

  // A prose line can legitimately begin with the same words as a heading
  // elsewhere on the page (for example, "inclusion criteria were
  // retrieved..."). Match the heading's typographic identity as well as its
  // text so those continuations stay inside the paragraph.
  if (candidate.fontName && line.fontName !== candidate.fontName) return null;
  return candidate;
}

function joinLayoutLine(previous: string, next: string): string {
  if (!previous) return next;
  if (/[-‐‑]$/.test(previous) && /^[a-zà-ÿ]/.test(next)) {
    return `${previous.slice(0, -1)}${next}`;
  }
  if (/[-‐‑]$/.test(previous) && /^[A-ZÀ-Ý0-9]/.test(next)) {
    return `${previous}${next}`;
  }
  return `${previous} ${next}`;
}

function beginSection(
  sections: PaperSection[],
  stack: string[],
  heading: HeadingCandidate,
): PaperSection {
  const level = Math.max(1, Math.min(6, heading.level));
  stack.length = level - 1;
  stack[level - 1] = heading.text;
  const path = stack.filter(Boolean);
  const section: PaperSection = {
    id: `sec${sections.length}`,
    title: heading.text,
    level,
    parent: level > 1 ? stack[level - 2] ?? null : null,
    path,
    kind: REFERENCES_HEADING.test(heading.text)
      ? "references"
      : METADATA_HEADING.test(heading.text)
        ? "metadata"
        : "content",
    paragraphs: [],
  };
  sections.push(section);
  return section;
}

function appendParagraph(
  section: PaperSection,
  text: string,
  pageNumber: number,
) {
  const clean = normalizeText(text);
  if (!clean) return;
  const previous = section.paragraphs.at(-1);
  if (previous && shouldMerge(previous.text, clean, previous.pageEnd, pageNumber)) {
    previous.text = `${previous.text}${joiner(previous.text, clean)}${clean}`;
    previous.pageEnd = pageNumber;
    return;
  }
  section.paragraphs.push({
    text: clean,
    pageStart: pageNumber,
    pageEnd: pageNumber,
  });
}

function sectionsToBlocks(sections: PaperSection[]): Block[] {
  const blocks: Block[] = [];
  let offset = 0;

  for (const section of sections) {
    // Editorial metadata is neither paper argument nor useful reader content.
    // References stay available in their collapsed reader section but never
    // enter the model.
    if (section.kind === "metadata") continue;
    for (const paragraph of section.paragraphs) {
      // A continuation can join text recovered from two columns/pages into a
      // long paragraph. Reflow it only at complete sentence boundaries; these
      // display blocks remain one section-level analysis unit.
      for (const text of coherentParagraphs(paragraph.text)) {
        const start = offset;
        const end = start + text.length;
        blocks.push({
          id: `p${blocks.length}`,
          start,
          end,
          text,
          section: section.title,
          sectionId: section.id,
          sectionLevel: section.level,
          sectionParent: section.parent,
          sectionPath: section.path,
          pageStart: paragraph.pageStart,
          pageEnd: paragraph.pageEnd,
          kind: section.kind,
          analysisUnit: "section",
        });
        offset = end + 2;
      }
    }
  }
  return blocks;
}

function headingAtStart(
  raw: string,
  candidates: HeadingCandidate[],
): HeadingCandidate | null {
  const chunk = raw.trim().replace(/^#{1,6}\s+/, "");
  const sorted = [...candidates].sort((a, b) => b.text.length - a.text.length);
  for (const candidate of sorted) {
    if (chunk.length < candidate.text.length) continue;
    if (chunk.slice(0, candidate.text.length).toLowerCase() !== candidate.text.toLowerCase()) {
      continue;
    }
    const boundary = chunk[candidate.text.length];
    if (boundary && !/\s/.test(boundary)) continue;
    return candidate;
  }
  return null;
}

function coherentParagraphs(raw: string, paragraphStarts: string[] = []): string[] {
  const text = normalizeText(raw);
  if (!text) return [];

  // LiteParse intentionally reflows a page into reading order, so blank
  // lines alone are not reliable paragraph boundaries. First-line indents
  // from the text layer are: split only where a typographic paragraph really
  // begins, and never manufacture new paragraphs merely to satisfy a size.
  const boundaries = new Set<number>();
  const lower = text.toLocaleLowerCase();
  for (const marker of paragraphStarts) {
    const normalizedMarker = normalizeText(marker);
    if (normalizedMarker.length < 8) continue;
    const endsInLineHyphen = /[-‐‑]$/.test(normalizedMarker);
    const searchableMarker = endsInLineHyphen
      ? normalizedMarker.slice(0, -1)
      : normalizedMarker;
    const markerLower = searchableMarker.toLocaleLowerCase();
    let from = 0;
    while (from < lower.length) {
      const index = lower.indexOf(markerLower, from);
      if (index < 0) break;
      const before = text[index - 1];
      const after = text[index + searchableMarker.length];
      if (
        index > 0 &&
        (!before || /\s/.test(before)) &&
        (endsInLineHyphen || !after || /\s|[.,;:!?()[\]]/.test(after))
      ) {
        boundaries.add(index);
      }
      from = index + searchableMarker.length;
    }
  }
  if (boundaries.size === 0) return [text];

  const starts = [0, ...boundaries].sort((a, b) => a - b);
  return starts
    .map((start, index) => text.slice(start, starts[index + 1] ?? text.length).trim())
    .filter(Boolean);
}

function collectParagraphStarts(
  page: IngestedPage,
  headings: HeadingCandidate[],
): string[] {
  const items = (page.textItems ?? []).filter((item) => {
    const rotation = Math.abs(item.rotation ?? 0) % 180;
    const height = page.height ?? 792;
    return (
      (rotation < 2 || rotation > 178) &&
      item.y > height * 0.08 &&
      item.y + item.height < height * 0.94 &&
      isLineStart(page, item)
    );
  });
  const headingTexts = new Set(headings.map((heading) => heading.text.toLocaleLowerCase()));
  const width = page.width ?? 612;
  const keyFor = (item: IngestedTextItem) =>
    `${item.fontName ?? ""}|${item.x >= width / 2 ? "right" : "left"}`;

  const baselineByKey = new Map<string, number>();
  for (const item of items) {
    const text = normalizeText(item.text);
    if (
      text.length < 3 ||
      headingTexts.has(text.toLocaleLowerCase()) ||
      TABLE_CAPTION.test(text)
    ) {
      continue;
    }
    const key = keyFor(item);
    const current = baselineByKey.get(key);
    if (current === undefined || item.x < current) baselineByKey.set(key, item.x);
  }

  const lineText = (item: IngestedTextItem) => {
    const rightColumn = item.x >= width / 2;
    return (page.textItems ?? [])
      .filter(
        (other) =>
          Math.abs(other.y - item.y) <= 1.8 &&
          (other.x >= width / 2) === rightColumn &&
          Math.abs(other.rotation ?? 0) % 180 < 2,
      )
      .sort((a, b) => a.x - b.x)
      .map((other) => other.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const starts: string[] = [];
  for (const item of items) {
    const baseline = baselineByKey.get(keyFor(item));
    if (baseline === undefined) continue;
    const indent = item.x - baseline;
    if (indent < 7 || indent > 30) continue;
    const marker = normalizeText(item.text);
    if (!/^[A-ZÀ-Ý]/.test(marker) || headingTexts.has(marker.toLocaleLowerCase())) {
      continue;
    }

    const rightColumn = item.x >= width / 2;
    const previous = items
      .filter(
        (other) =>
          other !== item &&
          other.y < item.y - 1.8 &&
          (other.x >= width / 2) === rightColumn &&
          keyFor(other) === keyFor(item),
      )
      .sort((a, b) => b.y - a.y)[0];
    if (previous && TERMINAL.test(lineText(previous))) starts.push(marker);
  }
  return Array.from(new Set(starts));
}

function collectRunningFurniture(pages: IngestedPage[]): string[] {
  const pagesByPhrase = new Map<string, Set<number>>();
  for (const page of pages) {
    const height = page.height ?? 792;
    for (const item of page.textItems ?? []) {
      const rotation = Math.abs(item.rotation ?? 0) % 180;
      const width = page.width ?? 612;
      const atSideMargin = item.x < width * 0.06 || item.x + item.width > width * 0.94;
      const inMargin =
        item.y < Math.max(70, height * 0.09) ||
        item.y + item.height > height * 0.93 ||
        (rotation > 2 && rotation < 178 && atSideMargin);
      if (!inMargin) continue;
      const phrase = normalizeFurniture(item.text);
      if (phrase.length < 5 || !looksLikeRunningFurniture(phrase)) continue;
      const seen = pagesByPhrase.get(phrase) ?? new Set<number>();
      seen.add(page.pageNumber);
      pagesByPhrase.set(phrase, seen);
    }
  }
  return [...pagesByPhrase.entries()]
    .filter(([, pageNumbers]) => pageNumbers.size >= 2)
    .map(([phrase]) => phrase)
    .sort((a, b) => b.length - a.length);
}

function cleanFurniturePrefix(raw: string, phrases: string[]): string {
  let text = raw.trim().replace(/^#{1,6}\s+/, "");
  for (let pass = 0; pass < 3; pass++) {
    const before = text;
    text = text.replace(/^\d{1,4}\s+[A-ZÀ-Ý](?:\.\s*)?[A-ZÀ-Ý .&'’–—-]{2,70}\s+ET AL\.\s*/i, "");
    for (const phrase of phrases) {
      const pattern = new RegExp(
        `^(?:\\d{1,4}\\s+)?${escapeRegExp(phrase)}(?:\\s+\\d{1,4})?(?:\\s+|$)`,
        "i",
      );
      text = text.replace(pattern, "");
    }
    text = text.replace(/^[&|·]+\s*/, "").trim();
    if (text === before) break;
  }
  return text;
}

function isMarkdownTable(raw: string): boolean {
  const lines = raw.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return false;
  const tableLines = lines.filter(
    (line) =>
      line.startsWith("|") ||
      /^\|?\s*:?-{3,}/.test(line) ||
      line === ".",
  ).length;
  return tableLines / lines.length >= 0.6;
}

function looksLikeNarrativeResume(raw: string): boolean {
  const text = normalizeText(raw);
  const words = text.split(/\s+/).length;
  const sentenceEnds = text.match(/[.!?][\])}"'’”]*(?:\s|$)/g)?.length ?? 0;
  return words >= 25 && (sentenceEnds >= 2 || /^\(/.test(text));
}

function looksLikeFigureDebris(raw: string): boolean {
  const text = normalizeText(raw);
  const words = text.split(/\s+/).length;
  const sentenceEnds = text.match(/[.!?][\])}"'’”]*(?:\s|$)/g)?.length ?? 0;
  if (sentenceEnds > 0 && words >= 20) return false;
  return (
    /^[\d\s=+→←↑↓-]+$/.test(text) ||
    /[«»+→←↑↓]/.test(text) ||
    /\bn\s*=\s*\d+/i.test(text) ||
    /\b(?:number of hits|ineligible if|not eligible|potentially [ec]ligible|eligible articles?|review of (?:the )?(?:title|and abstract|abstract|full text)|removal of duplicates|did not utilize|not published in|conference abstract|papers other than rcts?|subjects aged|unpublished)\b/i.test(
      text,
    )
  );
}

function protectReferenceTail(blocks: Block[]): Block[] {
  if (blocks.some((block) => block.kind === "references")) return blocks;
  const earliest = Math.floor(blocks.length * 0.55);
  const referenceLike = (text: string) => {
    const normalized = normalizeText(text);
    const yearCount = normalized.match(/\b(?:19|20)\d{2}[a-z]?\b/g)?.length ?? 0;
    return (
      /^(?:[A-ZÀ-Ý][A-Za-zÀ-ÿ'’.-]+(?:,|\s+[A-ZÀ-Ý]\.))/u.test(normalized) &&
      (yearCount >= 1 || /\bdoi\b|https?:\/\//i.test(normalized))
    );
  };

  let tailStart = -1;
  for (let index = earliest; index < blocks.length; index++) {
    const tail = blocks.slice(index);
    const window = tail.slice(0, 4);
    const referenceCount = tail.filter((block) => referenceLike(block.text)).length;
    if (
      window.length >= 3 &&
      window.filter((block) => referenceLike(block.text)).length >= 3 &&
      referenceCount / tail.length >= 0.7
    ) {
      tailStart = index;
      break;
    }
  }
  if (tailStart < 0) return blocks;

  const referenceSectionId = `references-tail-${tailStart}`;
  return blocks.map((block, index) =>
    index < tailStart
      ? block
      : {
          ...block,
          section: "References",
          sectionId: referenceSectionId,
          sectionLevel: 1,
          sectionParent: null,
          sectionPath: ["References"],
          kind: "references" as const,
        },
  );
}

function shouldMerge(
  previous: string,
  next: string,
  previousPage: number,
  nextPage: number,
): boolean {
  if (/^[-•]\s/.test(next)) return false;
  const crossesPage = nextPage > previousPage;
  const syntacticContinuation =
    !TERMINAL.test(previous) ||
    /^[a-zà-ÿ,;:)\]]/.test(next) ||
    /[-,;:]$/.test(previous);
  return syntacticContinuation && (crossesPage || !TERMINAL.test(previous));
}

function joiner(previous: string, next: string): string {
  if (/[-‐‑‒–—]$/.test(previous) && /^[a-zà-ÿ]/.test(next)) return "";
  return " ";
}

function looksLikeHeadingText(text: string): boolean {
  if (!text || text.length > 120 || EXCLUDED_HEADING.test(text)) return false;
  if (!/^[A-ZÀ-Ý0-9]/.test(text)) return false;
  if (INLINE_LABEL.test(text)) return false;
  if (/^(?:table|figure|fig\.|https?:|www\.|doi\b)/i.test(text)) return false;
  if (/^\(|[,;]$/.test(text) || /\b(?:19|20)\d{2}[a-z]?\b/.test(text)) return false;
  const words = text.split(/\s+/).length;
  return words <= 16 && !/[.!?]$/.test(text);
}

function isTableDominantPage(page: IngestedPage): boolean {
  const lines = (page.markdown || page.text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 4) return false;
  const tableLines = lines.filter(
    (line) => line.startsWith("|") || /^\|?\s*:?-{3,}/.test(line),
  ).length;
  return tableLines / lines.length >= 0.45;
}

function hasSubstantialMarkdownTable(page: IngestedPage): boolean {
  const tableLines = (page.markdown || page.text)
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) => line.startsWith("|") || /^\|?\s*:?-{3,}/.test(line),
    ).length;
  return tableLines >= 4;
}

function looksLikeRunningFurniture(text: string): boolean {
  const letters = text.replace(/[^A-Za-zÀ-ÿ]/g, "");
  const uppercase = letters.replace(/[^A-ZÀ-Ý]/g, "").length;
  return (
    /\bET AL\.?$/i.test(text) ||
    /downloaded by|doi|copyright/i.test(text) ||
    (letters.length >= 10 && uppercase / letters.length >= 0.82)
  );
}

function isLineStart(page: IngestedPage, item: IngestedTextItem): boolean {
  const half = (page.width ?? 612) / 2;
  const rightColumn = item.x >= half;
  return !(page.textItems ?? []).some((other) => {
    if (other === item || Math.abs(other.y - item.y) > 1.8) return false;
    if ((other.x >= half) !== rightColumn) return false;
    return other.x + other.width <= item.x + 1;
  });
}

function isLineIsolated(page: IngestedPage, item: IngestedTextItem): boolean {
  const half = (page.width ?? 612) / 2;
  const rightColumn = item.x >= half;
  return !(page.textItems ?? []).some((other) => {
    if (other === item || Math.abs(other.y - item.y) > 1.8) return false;
    if ((other.x >= half) !== rightColumn) return false;
    return other.x >= item.x + item.width - 1;
  });
}

function headingLevel(
  text: string,
  item: IngestedTextItem,
  topFonts: Set<string>,
): number {
  const numbered = text.match(/^(\d+(?:\.\d+)*)\.?\s+/);
  if (numbered) return Math.min(6, numbered[1].split(".").length);
  if (TOP_LEVEL_HEADING.test(text) || (item.fontName && topFonts.has(item.fontName))) {
    return 1;
  }
  const font = item.fontName ?? "";
  if (/(?:\.BI$|Bold.?Italic)/i.test(font)) return 2;
  if (/(?:\.I$|Italic)/i.test(font)) return 3;
  return 2;
}

function hasHeadingStyle(item: IngestedTextItem): boolean {
  return (
    (item.fontWeight ?? 0) >= 600 ||
    /(?:\.BI?$|\.I$|Bold|Italic|Semibold)/i.test(item.fontName ?? "")
  );
}

function isAccent(item: IngestedTextItem, bodyColor: string | undefined): boolean {
  const color = normalizeColor(item.fillColor);
  return Boolean(color && bodyColor && color !== bodyColor);
}

function normalizeColor(color: string | undefined): string | undefined {
  return color?.replace(/^#/, "").toLowerCase();
}

function normalizeFurniture(text: string): string {
  return normalizeText(text)
    .replace(/^\d{1,4}\s+/, "")
    .replace(/\s+\d{1,4}$/, "")
    .trim();
}

function normalizeText(text: string): string {
  return text
    .replace(/^#{1,6}\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
