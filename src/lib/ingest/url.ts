import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";
import { IngestError } from "./errors";
import {
  fetchPinned,
  type PinnedAddress,
  type PinnedResponse,
} from "../pinned-fetch";

export type IngestedDocument = {
  title: string | null;
  text: string;
  source: string;
  sourceRef: string;
  editorial?: IngestedEditorialDocument;
  pages?: IngestedPage[];
  parser?: "liteparse" | "pdfjs";
  complexity?: PdfPageComplexity[];
};

export type EditorialBlockKind =
  | "heading"
  | "paragraph"
  | "quote"
  | "list_item";

export type IngestedEditorialBlock = {
  kind: EditorialBlockKind;
  text: string;
  level?: number;
  section?: string | null;
  sectionLevel?: number;
  quoteAttribution?: string | null;
};

export type EditorialMetadata = {
  title?: string | null;
  canonicalUrl?: string | null;
  siteName?: string | null;
  author?: string | null;
  publishedAt?: string | null;
  modifiedAt?: string | null;
  description?: string | null;
  articleSection?: string | null;
  contentType?: string | null;
};

export type IngestedEditorialDocument = {
  metadata: EditorialMetadata;
  blocks: IngestedEditorialBlock[];
};

export type IngestedPage = {
  pageNumber: number;
  text: string;
  markdown: string;
  width?: number;
  height?: number;
  /**
   * Layout-aware PDF text. Academic consumers use this to tell real headings
   * from running headers and to keep section boundaries independent from page
   * and column breaks. It is intentionally optional for URLs, plain text and
   * the pdfjs fallback.
   */
  textItems?: IngestedTextItem[];
};

export type IngestedTextItem = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName?: string;
  fontSize?: number;
  fontHeight?: number;
  fontWeight?: number;
  fillColor?: string;
  rotation?: number;
};

export type PdfPageComplexity = {
  pageNumber: number;
  needsOcr: boolean;
  reasons: string[];
  hasSubstantialImages: boolean;
  imageCoverage: number;
  isGarbled: boolean;
  layout?: PdfPageLayoutComplexity;
};

export type PdfPageLayoutComplexity = {
  columnCount: number;
  ruledTableCount: number;
  ruledTableCoverage: number;
  textTableRunCount: number;
  figureCount: number;
  figureCoverage: number;
  isComplex: boolean;
  reasons: string[];
};

const FETCH_TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 5;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024; // 5 MB

const ARTICLE_BODY_SELECTORS = [
  "[itemprop='articleBody']",
  "[data-testid='article-body']",
  ".article-body",
  ".article__body",
  ".story-body",
  ".post-content-text",
  ".post-content",
  ".entry-content",
  ".article-content",
  "main article",
  "article",
] as const;

// Elements that commonly sit inside an article wrapper but are not editorial
// prose. Readability catches most of these on complete pages, while the extra
// pass is important for publisher-specific author, ad and recommendation
// widgets embedded directly in the article body.
const BOILERPLATE_SELECTOR = [
  "script",
  "style",
  "noscript",
  "template",
  "svg",
  "canvas",
  "iframe",
  "nav",
  "aside",
  "footer",
  "form",
  "dialog",
  "[hidden]",
  "[aria-hidden='true']",
  "[role='navigation']",
  "[role='complementary']",
  "[role='banner']",
  "[role='contentinfo']",
  ".no-print",
  ".screen-reader-text",
  ".visually-hidden",
  ".advertisement",
  ".advert",
  ".ad-container",
  ".ad-wrapper",
  "[id^='ad-']",
  "[class^='ad-']",
  "[class*=' ad-']",
  "[class*='-ad-']",
  "[class*='advert']",
  "[class*='newsletter']",
  "[class*='social-share']",
  "[class*='share-buttons']",
  "[class*='related-post']",
  "[class*='recommended']",
  "[class*='comments']",
  "[id^='comments']",
  "[class*='author-box']",
  "[class*='authors-box']",
  "[class*='multiple-authors']",
].join(",");

const TEXT_BLOCK_SELECTOR = [
  "address",
  "article",
  "blockquote",
  "dd",
  "div",
  "dl",
  "dt",
  "figcaption",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "li",
  "main",
  "p",
  "pre",
  "section",
  "td",
  "th",
].join(",");

export type ReadableHtml = {
  title: string | null;
  text: string;
  editorial: IngestedEditorialDocument;
};

type ArticleCandidate = {
  text: string;
  blocks: IngestedEditorialBlock[];
};

/**
 * Extract the editorial prose from HTML without doing any network work.
 * Keeping this stage pure makes publisher regressions reproducible in tests.
 */
export function extractReadableHtml(html: string, url: string): ReadableHtml {
  const dom = new JSDOM(html, { url });
  const document = dom.window.document;
  const openGraphTitle = cleanInlineText(
    document.querySelector<HTMLMetaElement>("meta[property='og:title']")
      ?.content ?? "",
  );
  const documentTitle = cleanInlineText(document.title);
  const metadata = extractEditorialMetadata(document, url);

  removeBoilerplate(document);

  // Capture a semantic body before Readability mutates the document. This is
  // a recovery path for pages whose CMS markup causes Readability to truncate
  // the article, not a replacement for Readability's scoring.
  const semanticArticle = findBestSemanticArticle(document);
  const bodyArticle = document.body
    ? extractElementContent(document.body)
    : emptyArticleCandidate();
  const article = new Readability(document).parse();
  const readabilityArticle = article?.content
    ? extractFragmentContent(article.content, url)
    : candidateFromText(article?.textContent ?? "");

  const chosen = chooseArticleContent(
    readabilityArticle,
    semanticArticle,
    bodyArticle,
  );
  const title =
    openGraphTitle ||
    cleanInlineText(article?.title ?? "") ||
    documentTitle ||
    null;

  return {
    title,
    text: chosen.text,
    editorial: {
      metadata: { ...metadata, title },
      blocks: chosen.blocks,
    },
  };
}

export async function ingestUrl(url: string): Promise<IngestedDocument> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);

  let currentUrl: URL = parseAndValidateUrl(url);

  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const approvedAddress = await assertHostIsPublic(currentUrl.hostname);
      const pinned = await fetchPinned(currentUrl, approvedAddress, {
        redirect: "manual",
        signal: ctrl.signal,
        headers: browserHeaders(),
      });
      const { response } = pinned;
      let bodyConsumed = false;

      try {
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get("location");
          if (!location) {
            throw new IngestError(
              "fetch_failed",
              `Redirect with no Location header (${response.status})`,
              response.status,
            );
          }
          if (hop === MAX_REDIRECTS) {
            throw new IngestError(
              "fetch_failed",
              "Too many redirects",
              response.status,
            );
          }
          await response.body?.cancel();
          bodyConsumed = true;
          currentUrl = parseAndValidateUrl(
            new URL(location, currentUrl).toString(),
          );
          continue;
        }

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new IngestError(
              "blocked",
              `The site refused our request (${response.status})`,
              response.status,
            );
          }
          if (response.status === 404) {
            throw new IngestError("not_found", "The page returned 404", 404);
          }
          if (response.status === 429) {
            throw new IngestError(
              "rate_limited",
              "The site rate-limited us",
              429,
            );
          }
          throw new IngestError(
            "fetch_failed",
            `Could not fetch the URL (${response.status} ${response.statusText})`,
            response.status,
          );
        }

        const html = await readCappedText(response, MAX_RESPONSE_BYTES);
        bodyConsumed = true;
        const { title, text, editorial } = extractReadableHtml(
          html,
          currentUrl.toString(),
        );

        if (text.length < 40) {
          throw new IngestError(
            "extraction_failed",
            "Could not extract readable content from the page",
          );
        }

        return {
          title,
          text,
          source: "url",
          sourceRef: currentUrl.toString(),
          editorial,
        };
      } finally {
        if (!bodyConsumed) {
          await response.body?.cancel().catch(() => undefined);
        }
        await pinned.close();
      }
    }
    throw new IngestError("fetch_failed", "No response received");
  } catch (err) {
    if (err instanceof IngestError) throw err;
    if ((err as Error)?.name === "AbortError") {
      throw new IngestError("timeout", "The site took too long to respond");
    }
    throw new IngestError(
      "unreachable",
      `Could not reach the URL: ${(err as Error)?.message ?? "network error"}`,
    );
  } finally {
    clearTimeout(timer);
  }
}

function removeBoilerplate(root: ParentNode): void {
  root.querySelectorAll(BOILERPLATE_SELECTOR).forEach((element) => {
    element.remove();
  });
}

function findBestSemanticArticle(document: Document): ArticleCandidate {
  const seen = new Set<Element>();
  let best = emptyArticleCandidate();
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const selector of ARTICLE_BODY_SELECTORS) {
    for (const element of document.querySelectorAll(selector)) {
      if (seen.has(element)) continue;
      seen.add(element);

      const candidate = extractElementContent(element);
      if (candidate.text.length < 200) continue;

      const paragraphCount = candidate.blocks.filter(
        (block) => block.kind !== "heading",
      ).length;
      const linkTextLength = Array.from(element.querySelectorAll("a"))
        .map((link) => cleanInlineText(link.textContent ?? "").length)
        .reduce((sum, length) => sum + length, 0);
      const linkRatio = linkTextLength / Math.max(1, candidate.text.length);
      const score =
        candidate.text.length +
        paragraphCount * 120 -
        linkRatio * candidate.text.length * 2;

      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
  }

  return best;
}

function extractFragmentContent(html: string, url: string): ArticleCandidate {
  const fragment = new JSDOM(`<body>${html}</body>`, { url });
  removeBoilerplate(fragment.window.document);
  return fragment.window.document.body
    ? extractElementContent(fragment.window.document.body)
    : emptyArticleCandidate();
}

function extractElementContent(element: Element): ArticleCandidate {
  const clone = element.cloneNode(true) as Element;
  removeBoilerplate(clone);
  const blocks = extractEditorialBlocks(clone);
  const contentBlocks = blocks.filter((block) => block.kind !== "heading");
  if (contentBlocks.length > 0) {
    return {
      text: contentBlocks.map((block) => block.text).join("\n\n"),
      blocks,
    };
  }

  const ownerDocument = clone.ownerDocument;

  clone.querySelectorAll("br").forEach((br) => {
    br.replaceWith(ownerDocument.createTextNode("\n"));
  });
  clone.querySelectorAll(TEXT_BLOCK_SELECTOR).forEach((block) => {
    block.insertBefore(ownerDocument.createTextNode("\n\n"), block.firstChild);
    block.appendChild(ownerDocument.createTextNode("\n\n"));
  });

  return candidateFromText(clone.textContent ?? "");
}

function chooseArticleContent(
  readability: ArticleCandidate,
  semantic: ArticleCandidate,
  body: ArticleCandidate,
): ArticleCandidate {
  if (readability.text.length >= 40) {
    // Prefer the semantically-marked body only when it recovered meaningful
    // content that Readability dropped. Small differences are usually titles,
    // captions or bylines that Readability correctly excluded.
    if (semantic.text.length > readability.text.length * 1.12) {
      return semantic;
    }
    return readability;
  }
  if (semantic.text.length >= 40) return semantic;
  return body;
}

function extractEditorialBlocks(root: Element): IngestedEditorialBlock[] {
  const blocks: IngestedEditorialBlock[] = [];
  let section: string | null = null;
  let sectionLevel: number | undefined;
  const nodes = root.querySelectorAll(
    "h1,h2,h3,h4,h5,h6,p,blockquote,li",
  );

  for (const node of nodes) {
    const tag = node.tagName.toLowerCase();
    if (tag === "p" && node.closest("blockquote,li")) continue;
    if (tag === "li" && node.parentElement?.closest("li")) continue;

    if (/^h[1-6]$/.test(tag)) {
      const text = cleanInlineText(node.textContent ?? "");
      if (!text) continue;
      section = text;
      sectionLevel = Number.parseInt(tag.slice(1), 10);
      blocks.push({ kind: "heading", text, level: sectionLevel });
      continue;
    }

    const quoteAttribution =
      tag === "blockquote"
        ? cleanInlineText(
            node.querySelector("cite")?.textContent ??
              node.getAttribute("data-attribution") ??
              "",
          ) || null
        : null;
    const contentNode = node.cloneNode(true) as Element;
    contentNode.querySelectorAll("cite,ol,ul").forEach((child) => child.remove());
    const text = cleanMultilineText(contentNode.textContent ?? "");
    if (!text || blocks.at(-1)?.text === text) continue;

    blocks.push({
      kind:
        tag === "blockquote"
          ? "quote"
          : tag === "li"
            ? "list_item"
            : "paragraph",
      text,
      section,
      sectionLevel,
      ...(quoteAttribution ? { quoteAttribution } : {}),
    });
  }

  return blocks;
}

function candidateFromText(text: string): ArticleCandidate {
  const cleaned = cleanMultilineText(text);
  if (!cleaned) return emptyArticleCandidate();
  const paragraphs = cleaned.split(/\n{2,}/).filter(Boolean);
  return {
    text: paragraphs.join("\n\n"),
    blocks: paragraphs.map((paragraph) => ({
      kind: "paragraph",
      text: paragraph,
      section: null,
    })),
  };
}

function emptyArticleCandidate(): ArticleCandidate {
  return { text: "", blocks: [] };
}

function extractEditorialMetadata(
  document: Document,
  sourceUrl: string,
): EditorialMetadata {
  const structured = findStructuredArticle(document);
  const canonicalHref =
    document.querySelector<HTMLLinkElement>("link[rel='canonical']")?.href ??
    sourceUrl;

  return {
    canonicalUrl: normalizeHttpUrl(canonicalHref, sourceUrl),
    siteName: firstNonEmpty(
      metaContent(document, "property", "og:site_name"),
      asText(structured?.publisher),
    ),
    author: firstNonEmpty(
      metaContent(document, "name", "author"),
      metaContent(document, "property", "article:author"),
      asAuthor(structured?.author),
    ),
    publishedAt: firstNonEmpty(
      metaContent(document, "property", "article:published_time"),
      asText(structured?.datePublished),
    ),
    modifiedAt: firstNonEmpty(
      metaContent(document, "property", "article:modified_time"),
      asText(structured?.dateModified),
    ),
    description: firstNonEmpty(
      metaContent(document, "property", "og:description"),
      metaContent(document, "name", "description"),
      asText(structured?.description),
    ),
    articleSection: firstNonEmpty(
      metaContent(document, "property", "article:section"),
      asText(structured?.articleSection),
    ),
    contentType: firstNonEmpty(
      asSchemaType(structured?.["@type"]),
      metaContent(document, "property", "og:type"),
    ),
  };
}

function metaContent(
  document: Document,
  attribute: "name" | "property",
  value: string,
): string | null {
  const content = document.querySelector<HTMLMetaElement>(
    `meta[${attribute}='${value}']`,
  )?.content;
  return content ? capMetadata(content) : null;
}

function findStructuredArticle(
  document: Document,
): Record<string, unknown> | null {
  const articleTypes = new Set([
    "Article",
    "NewsArticle",
    "BlogPosting",
    "AnalysisNewsArticle",
    "OpinionNewsArticle",
    "ReportageNewsArticle",
  ]);

  for (const script of document.querySelectorAll<HTMLScriptElement>(
    "script[type='application/ld+json']",
  )) {
    try {
      const parsed = JSON.parse(script.textContent ?? "") as unknown;
      const queue: unknown[] = [parsed];
      while (queue.length > 0) {
        const value = queue.shift();
        if (Array.isArray(value)) {
          queue.push(...value);
          continue;
        }
        if (!value || typeof value !== "object") continue;
        const object = value as Record<string, unknown>;
        const types = Array.isArray(object["@type"])
          ? object["@type"]
          : [object["@type"]];
        if (types.some((type) => typeof type === "string" && articleTypes.has(type))) {
          return object;
        }
        if (object["@graph"]) queue.push(object["@graph"]);
      }
    } catch {
      // Invalid third-party structured data must not break article ingestion.
    }
  }
  return null;
}

function asAuthor(value: unknown): string | null {
  const values = Array.isArray(value) ? value : [value];
  const authors = values
    .map((author) =>
      typeof author === "string"
        ? author
        : author && typeof author === "object"
          ? asText((author as Record<string, unknown>).name)
          : null,
    )
    .filter((author): author is string => Boolean(author));
  return authors.length > 0 ? capMetadata(authors.join(", ")) : null;
}

function asText(value: unknown): string | null {
  if (typeof value === "string") return capMetadata(value);
  if (value && typeof value === "object") {
    const name = (value as Record<string, unknown>).name;
    if (typeof name === "string") return capMetadata(name);
  }
  return null;
}

function asSchemaType(value: unknown): string | null {
  if (typeof value === "string") return capMetadata(value);
  if (Array.isArray(value)) {
    return value.find((item): item is string => typeof item === "string") ?? null;
  }
  return null;
}

function firstNonEmpty(...values: (string | null | undefined)[]): string | null {
  return values.find((value): value is string => Boolean(value?.trim())) ?? null;
}

function capMetadata(value: string): string {
  return cleanInlineText(value).slice(0, 2_000);
}

function normalizeHttpUrl(value: string, base: string): string | null {
  try {
    const parsed = new URL(value, base);
    return /^https?:$/.test(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function cleanInlineText(text: string): string {
  return text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function cleanMultilineText(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[\t\f\v ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Mimics a current Chrome on Windows. Most Brazilian outlets (Folha,
// Estadão, G1, UOL, etc.) reject anything that looks like a bot UA but
// happily serve any string that *parses* as a real browser. Cloudflare's
// IUAM / TLS fingerprinting we can't beat from Node, but those represent
// a minority of the sites users paste.
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

function browserHeaders(): Record<string, string> {
  return {
    "user-agent": USER_AGENT,
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    // Brazilian Portuguese first — most user submissions are PT-BR sites.
    "accept-language": "pt-BR,pt;q=0.9,en;q=0.7,en-US;q=0.6",
    // Don't ask for br/zstd — undici sometimes negotiates them but then
    // we'd need to decompress manually. gzip + deflate are decompressed
    // transparently.
    "accept-encoding": "gzip, deflate",
    "cache-control": "no-cache",
    pragma: "no-cache",
    // Client hints — match the UA above. Helps with sites that compare
    // sec-ch-ua against the UA string.
    "sec-ch-ua": '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    // Fetch-mode signals identical to a top-level navigation from a
    // bookmark / typed URL.
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
  };
}

function parseAndValidateUrl(input: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new IngestError("invalid_url", "Invalid URL");
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    throw new IngestError("invalid_url", "Only http(s) URLs are supported");
  }
  return parsed;
}

async function assertHostIsPublic(hostname: string): Promise<PinnedAddress> {
  // URL.hostname keeps brackets around IPv6 literals; strip before isIP.
  const bare = hostname.startsWith("[") && hostname.endsWith("]")
    ? hostname.slice(1, -1)
    : hostname;
  // If the host is already an IP literal, validate it directly. Otherwise
  // resolve via DNS and reject if any answer points to a non-public range.
  const ipVersion = isIP(bare);
  const addresses: { address: string; family: number }[] =
    ipVersion !== 0
      ? [{ address: bare, family: ipVersion }]
      : await dnsLookup(bare, { all: true });

  if (addresses.length === 0) {
    throw new IngestError("unreachable", "The URL hostname did not resolve");
  }
  for (const { address, family } of addresses) {
    if (isBlockedAddress(address, family)) {
      throw new IngestError(
        "blocked",
        "URLs pointing at private, loopback, or link-local addresses are not allowed",
      );
    }
  }
  const approved = addresses[0];
  return {
    address: approved.address,
    family: approved.family === 6 ? 6 : 4,
  };
}

function isBlockedAddress(ip: string, family: number): boolean {
  if (family === 4) return isBlockedIPv4(ip);
  if (family === 6) return isBlockedIPv6(ip);
  return true;
}

function isBlockedIPv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => Number.parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  // 0.0.0.0/8 — "this network"
  if (a === 0) return true;
  // 10.0.0.0/8 — RFC1918 private
  if (a === 10) return true;
  // 100.64.0.0/10 — CGNAT
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 127.0.0.0/8 — loopback
  if (a === 127) return true;
  // 169.254.0.0/16 — link-local (incl. cloud metadata 169.254.169.254)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12 — RFC1918 private
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.0.0.0/24, 192.0.2.0/24, 198.18.0.0/15, 198.51.100.0/24, 203.0.113.0/24 — reserved/test
  if (a === 192 && b === 0) return true;
  if (a === 198 && (b === 18 || b === 19 || b === 51)) return true;
  if (a === 203 && b === 0) return true;
  // 192.168.0.0/16 — RFC1918 private
  if (a === 192 && b === 168) return true;
  // 224.0.0.0/4 — multicast
  if (a >= 224 && a <= 239) return true;
  // 240.0.0.0/4 — reserved (includes 255.255.255.255)
  if (a >= 240) return true;
  return false;
}

function isBlockedIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  // ::, ::1 — unspecified, loopback
  if (lower === "::" || lower === "::1") return true;
  // fc00::/7 — unique local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  // fe80::/10 — link-local
  if (lower.startsWith("fe8") || lower.startsWith("fe9") ||
      lower.startsWith("fea") || lower.startsWith("feb")) return true;
  // ff00::/8 — multicast
  if (lower.startsWith("ff")) return true;
  // ::ffff:0:0/96 — IPv4-mapped — pull out the embedded v4 and check
  const v4Mapped = lower.match(/^::ffff:([0-9.]+)$/);
  if (v4Mapped) return isBlockedIPv4(v4Mapped[1]);
  return false;
}

async function readCappedText(
  res: PinnedResponse,
  maxBytes: number,
): Promise<string> {
  // Stream and stop reading after maxBytes so a malicious server can't make
  // us buffer gigabytes into memory.
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new IngestError("fetch_failed", "Response exceeded size cap");
    }
    chunks.push(value);
  }
  return new TextDecoder("utf-8").decode(Buffer.concat(chunks.map((c) => Buffer.from(c))));
}
