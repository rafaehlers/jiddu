import * as cheerio from "cheerio";
import { assertPublicHost } from "./api/pdf-source";
import type { ReviewSource } from "./paper-review-schema";

const MAX_REDIRECTS = 3;
const MAX_SOURCE_BYTES = 256 * 1024;
const FETCH_TIMEOUT_MS = 12_000;
const CONCURRENCY = 4;

export async function validateReviewSources(
  sources: ReviewSource[],
): Promise<ReviewSource[]> {
  const results = new Array<ReviewSource>(sources.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, sources.length) }, async () => {
      while (cursor < sources.length) {
        const index = cursor;
        cursor += 1;
        const source = sources[index];
        if (!source) continue;
        results[index] = await validateReviewSource(source);
      }
    }),
  );
  return results;
}

export async function validateReviewSource(
  source: ReviewSource,
): Promise<ReviewSource> {
  const publicationType = classifyPublication(source.url);
  try {
    const result = await fetchSourceMetadata(source.url);
    const titleMatches =
      !source.title ||
      !result.observedTitle ||
      titleSimilarity(source.title, result.observedTitle) >= 0.45;
    return {
      ...source,
      publicationType,
      observedTitle: result.observedTitle,
      verificationStatus: titleMatches ? "verified" : "mismatch",
      verificationNote: titleMatches
        ? `HTTP ${result.status}; source metadata was reachable${
            result.observedTitle ? " and the title was consistent" : ""
          }.`
        : `HTTP ${result.status}; the observed title does not match the cited title.`,
    };
  } catch (err) {
    return {
      ...source,
      publicationType,
      observedTitle: null,
      verificationStatus: "unreachable",
      verificationNote:
        err instanceof Error
          ? `Automatic verification failed: ${err.message}`
          : "Automatic verification failed.",
    };
  }
}

async function fetchSourceMetadata(
  rawUrl: string,
): Promise<{ status: number; observedTitle: string | null }> {
  let current = parseAuditUrl(rawUrl);
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    await assertPublicHost(current);
    const response = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        accept: "text/html,application/xhtml+xml,application/pdf;q=0.8,*/*;q=0.2",
        "user-agent": "Jiddu-Source-Audit/1.0 (+https://jiddu.app)",
      },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirect === MAX_REDIRECTS) {
        throw new Error("redirect could not be resolved");
      }
      current = parseAuditUrl(new URL(location, current).toString());
      continue;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("pdf")) {
      await response.body?.cancel();
      return { status: response.status, observedTitle: null };
    }
    const html = await readLimitedText(response);
    return {
      status: response.status,
      observedTitle: extractTitle(html),
    };
  }
  throw new Error("source could not be resolved");
}

function parseAuditUrl(rawUrl: string): URL {
  const url = new URL(rawUrl);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("source URL must use HTTP or HTTPS");
  }
  if (url.username || url.password) {
    throw new Error("authenticated source URLs are not accepted");
  }
  const expectedPort = url.protocol === "https:" ? "443" : "80";
  if (url.port && url.port !== expectedPort) {
    throw new Error("source URL uses a non-standard port");
  }
  return url;
}

async function readLimitedText(response: Response): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_SOURCE_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    const remaining = MAX_SOURCE_BYTES - total;
    chunks.push(value.subarray(0, remaining));
    total += Math.min(value.byteLength, remaining);
    if (value.byteLength > remaining) break;
  }
  await reader.cancel().catch(() => null);
  const joined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(joined);
}

function extractTitle(html: string): string | null {
  if (!html.trim()) return null;
  const $ = cheerio.load(html);
  const candidates = [
    $('meta[name="citation_title"]').attr("content"),
    $('meta[property="og:title"]').attr("content"),
    $("title").text(),
    $("h1").first().text(),
  ];
  return (
    candidates
      .map((candidate) => candidate?.replace(/\s+/g, " ").trim())
      .find(Boolean) ?? null
  );
}

function classifyPublication(url: string): ReviewSource["publicationType"] {
  const hostname = new URL(url).hostname.toLowerCase();
  if (
    hostname === "arxiv.org" ||
    hostname.endsWith(".arxiv.org") ||
    hostname.includes("biorxiv") ||
    hostname.includes("medrxiv")
  ) {
    return "preprint";
  }
  if (
    hostname.includes("docs.") ||
    hostname.includes("developer.") ||
    hostname.includes("readthedocs") ||
    hostname.includes("w3.org")
  ) {
    return "documentation";
  }
  if (
    hostname === "doi.org" ||
    hostname.includes("aclanthology.org") ||
    hostname.includes("proceedings.") ||
    hostname.includes("jmlr.org") ||
    hostname.includes("mlr.press") ||
    hostname.includes("ieee.org") ||
    hostname.includes("acm.org") ||
    hostname.includes("springer.") ||
    hostname.includes("nature.com") ||
    hostname.includes("sciencedirect.com")
  ) {
    return "published";
  }
  return "unknown";
}

function titleSimilarity(expected: string, observed: string): number {
  const expectedTokens = tokenSet(expected);
  const observedTokens = tokenSet(observed);
  if (expectedTokens.size === 0 || observedTokens.size === 0) return 0;
  let overlap = 0;
  for (const token of expectedTokens) {
    if (observedTokens.has(token)) overlap += 1;
  }
  return overlap / Math.min(expectedTokens.size, observedTokens.size);
}

function tokenSet(value: string): Set<string> {
  return new Set(
    value
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2),
  );
}
