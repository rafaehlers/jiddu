import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { MAX_PDF_BYTES, PaperReviewInputError } from "@/lib/paper-review-job";
import {
  fetchPinned,
  type PinnedAddress,
  type PinnedResponse,
} from "@/lib/pinned-fetch";

const MAX_REDIRECTS = 4;
const FETCH_TIMEOUT_MS = 30_000;

export async function fetchPublicPdf(
  rawUrl: string,
): Promise<{ buffer: ArrayBuffer; filename: string; sourceRef: string }> {
  let current = parsePublicPdfUrl(rawUrl);

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const approvedAddress = await assertPublicHost(current);
    const pinned = await fetchPinned(current, approvedAddress, {
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        accept: "application/pdf",
        "user-agent": "Jiddu-Paper-Review/1.0 (+https://jiddu.app)",
      },
    });
    const { response } = pinned;
    let bodyConsumed = false;

    try {
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) {
          throw new PaperReviewInputError(
            "The PDF URL returned a redirect without a destination.",
            422,
            "invalid_pdf_url",
          );
        }
        if (redirect === MAX_REDIRECTS) {
          throw new PaperReviewInputError(
            "The PDF URL redirected too many times.",
            422,
            "too_many_redirects",
          );
        }
        await response.body?.cancel();
        bodyConsumed = true;
        current = parsePublicPdfUrl(new URL(location, current).toString());
        continue;
      }

      if (!response.ok) {
        throw new PaperReviewInputError(
          `The PDF URL returned HTTP ${response.status}.`,
          422,
          "pdf_fetch_failed",
        );
      }

      const declaredLength = Number.parseInt(
        response.headers.get("content-length") ?? "",
        10,
      );
      if (Number.isFinite(declaredLength) && declaredLength > MAX_PDF_BYTES) {
        throw new PaperReviewInputError(
          `The remote PDF exceeds the ${MAX_PDF_BYTES / 1024 / 1024} MB limit.`,
          413,
          "pdf_too_large",
        );
      }

      const buffer = await readLimitedBody(response);
      bodyConsumed = true;
      return {
        buffer,
        filename: filenameFromResponse(response, current),
        sourceRef: current.toString(),
      };
    } finally {
      if (!bodyConsumed) {
        await response.body?.cancel().catch(() => undefined);
      }
      await pinned.close();
    }
  }

  throw new PaperReviewInputError(
    "The PDF URL could not be resolved.",
    422,
    "pdf_fetch_failed",
  );
}

function parsePublicPdfUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new PaperReviewInputError(
      "`pdf_url` must be a valid public HTTP(S) URL.",
      400,
      "invalid_pdf_url",
    );
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new PaperReviewInputError(
      "`pdf_url` must use HTTP or HTTPS.",
      400,
      "invalid_pdf_url",
    );
  }
  if (url.username || url.password) {
    throw new PaperReviewInputError(
      "Authenticated PDF URLs are not accepted.",
      400,
      "invalid_pdf_url",
    );
  }
  const expectedPort = url.protocol === "https:" ? "443" : "80";
  if (url.port && url.port !== expectedPort) {
    throw new PaperReviewInputError(
      "PDF URLs must use the standard HTTP or HTTPS port.",
      400,
      "invalid_pdf_url",
    );
  }
  return url;
}

export async function assertPublicHost(url: URL): Promise<PinnedAddress> {
  const hostname = url.hostname
    .toLowerCase()
    .replace(/\.$/, "")
    .replace(/^\[(.*)\]$/, "$1");
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw privateUrlError();
  }

  if (isIP(hostname)) {
    if (!isPublicIp(hostname)) throw privateUrlError();
    return {
      address: hostname,
      family: isIP(hostname) === 6 ? 6 : 4,
    };
  }

  let addresses;
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new PaperReviewInputError(
      "The PDF URL hostname could not be resolved.",
      422,
      "pdf_fetch_failed",
    );
  }
  if (addresses.length === 0 || addresses.some(({ address }) => !isPublicIp(address))) {
    throw privateUrlError();
  }
  const approved = addresses[0];
  return {
    address: approved.address,
    family: approved.family === 6 ? 6 : 4,
  };
}

function isPublicIp(address: string): boolean {
  if (address.includes(".")) {
    const octets = address.split(".").map(Number);
    if (
      octets.length !== 4 ||
      octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
    ) {
      return false;
    }
    const [a, b] = octets;
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }

  const normalized = address.toLowerCase();
  if (normalized.startsWith("::ffff:")) {
    return isPublicIp(normalized.slice("::ffff:".length));
  }
  return !(
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith("ff") ||
    normalized.startsWith("2001:db8:")
  );
}

async function readLimitedBody(
  response: PinnedResponse,
): Promise<ArrayBuffer> {
  if (!response.body) {
    throw new PaperReviewInputError(
      "The PDF URL returned an empty response.",
      422,
      "empty_pdf",
    );
  }
  const chunks: Uint8Array[] = [];
  const reader = response.body.getReader();
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_PDF_BYTES) {
      await reader.cancel();
      throw new PaperReviewInputError(
        `The remote PDF exceeds the ${MAX_PDF_BYTES / 1024 / 1024} MB limit.`,
        413,
        "pdf_too_large",
      );
    }
    chunks.push(value);
  }
  const joined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return joined.buffer;
}

function filenameFromResponse(response: PinnedResponse, url: URL): string {
  const disposition = response.headers.get("content-disposition") ?? "";
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  const fromHeader = encoded ? safeDecode(encoded) : plain?.trim();
  const fromPath = safeDecode(url.pathname.split("/").pop() ?? "");
  const candidate = fromHeader || fromPath || "remote-paper.pdf";
  return candidate.toLowerCase().endsWith(".pdf")
    ? candidate.slice(0, 500)
    : `${candidate.slice(0, 496)}.pdf`;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function privateUrlError(): PaperReviewInputError {
  return new PaperReviewInputError(
    "The PDF URL must resolve to a public internet address.",
    400,
    "private_pdf_url",
  );
}
