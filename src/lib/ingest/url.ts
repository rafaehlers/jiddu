import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";
import { IngestError } from "./errors";

export type IngestedDocument = {
  title: string | null;
  text: string;
  source: string;
  sourceRef: string;
};

const FETCH_TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 5;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function ingestUrl(url: string): Promise<IngestedDocument> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);

  let currentUrl: URL = parseAndValidateUrl(url);
  let res: Response | null = null;

  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      await assertHostIsPublic(currentUrl.hostname);

      const response = await fetch(currentUrl.toString(), {
        redirect: "manual",
        signal: ctrl.signal,
        headers: browserHeaders(),
      });

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
        currentUrl = parseAndValidateUrl(
          new URL(location, currentUrl).toString(),
        );
        continue;
      }

      res = response;
      break;
    }
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

  if (!res) {
    throw new IngestError("fetch_failed", "No response received");
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new IngestError(
        "blocked",
        `The site refused our request (${res.status})`,
        res.status,
      );
    }
    if (res.status === 404) {
      throw new IngestError("not_found", "The page returned 404", 404);
    }
    if (res.status === 429) {
      throw new IngestError("rate_limited", "The site rate-limited us", 429);
    }
    throw new IngestError(
      "fetch_failed",
      `Could not fetch the URL (${res.status} ${res.statusText})`,
      res.status,
    );
  }

  const html = await readCappedText(res, MAX_RESPONSE_BYTES);
  const dom = new JSDOM(html, { url: currentUrl.toString() });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  const title = article?.title?.trim() || dom.window.document.title || null;
  const text = (article?.textContent || dom.window.document.body?.textContent || "")
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (text.length < 40) {
    throw new IngestError(
      "extraction_failed",
      "Could not extract readable content from the page",
    );
  }

  return { title, text, source: "url", sourceRef: currentUrl.toString() };
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

async function assertHostIsPublic(hostname: string): Promise<void> {
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

  for (const { address, family } of addresses) {
    if (isBlockedAddress(address, family)) {
      throw new IngestError(
        "blocked",
        "URLs pointing at private, loopback, or link-local addresses are not allowed",
      );
    }
  }
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

async function readCappedText(res: Response, maxBytes: number): Promise<string> {
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
