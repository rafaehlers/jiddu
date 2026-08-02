export const MIN_API_TEXT_CHARS = 40;
export const MAX_API_TEXT_CHARS = 2000;
export const MAX_FACTCHECK_TEXT_CHARS = 10000;

export const API_BASES = Object.freeze([
  "https://jiddu.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

export const DEFAULT_API_BASE = API_BASES[0];

export const LENSES = Object.freeze({
  fallacies: {
    endpoint: "/api/v1/detect-fallacies",
  },
  facts: {
    endpoint: "/api/v1/fact-check",
  },
  neutrality: {
    endpoint: "/api/v1/assess-neutrality",
  },
});

export function endpointForLens(lens) {
  const endpoint = LENSES[lens]?.endpoint;
  if (!endpoint) throw new Error("Invalid analysis lens.");
  return endpoint;
}

export function maxCharsForLens(lens) {
  return lens === "facts" ? MAX_FACTCHECK_TEXT_CHARS : MAX_API_TEXT_CHARS;
}

export function chunkConcurrencyForLens(lens) {
  return lens === "facts" ? 2 : 1;
}

export function normalizeApiBase(value) {
  const normalized = String(value || "").trim().replace(/\/$/, "");
  return API_BASES.includes(normalized) ? normalized : DEFAULT_API_BASE;
}

export function normalizeSelectionText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function splitIntoApiChunks(value, maxChars = MAX_API_TEXT_CHARS) {
  const text = normalizeSelectionText(value);
  if (!text) return [];
  if (text.length <= maxChars) return [text];

  const chunks = [];
  let remaining = text;

  while (remaining.length > maxChars) {
    const cut = findNaturalCut(remaining, maxChars);
    const chunk = remaining.slice(0, cut).trim();
    if (!chunk) break;
    chunks.push(chunk);
    remaining = remaining.slice(cut).trim();
  }

  if (remaining) chunks.push(remaining);
  rebalanceShortTail(chunks, maxChars);
  return chunks;
}

function findNaturalCut(text, maxChars) {
  const floor = Math.max(MIN_API_TEXT_CHARS, Math.floor(maxChars * 0.55));
  const window = text.slice(0, maxChars + 1);
  const boundaryPatterns = [/\n\n/g, /[.!?][\"'”’)]*\s+/g, /[;:]\s+/g, /\s+/g];

  for (const pattern of boundaryPatterns) {
    let match;
    let last = -1;
    while ((match = pattern.exec(window)) !== null) {
      const candidate = match.index + match[0].length;
      if (candidate > maxChars) break;
      if (candidate >= floor) last = candidate;
    }
    if (last > 0) return last;
  }

  return maxChars;
}

function rebalanceShortTail(chunks, maxChars) {
  if (chunks.length < 2) return;
  let tail = chunks[chunks.length - 1];
  if (tail.length >= MIN_API_TEXT_CHARS) return;

  let previous = chunks[chunks.length - 2];
  while (tail.length < MIN_API_TEXT_CHARS && previous.length > MIN_API_TEXT_CHARS) {
    let cut = previous.lastIndexOf(" ");
    if (cut < MIN_API_TEXT_CHARS) {
      cut = Math.max(MIN_API_TEXT_CHARS, previous.length - (MIN_API_TEXT_CHARS - tail.length));
    }
    const moved = previous.slice(cut).trim();
    previous = previous.slice(0, cut).trim();
    tail = `${moved} ${tail}`.trim();
  }

  if (previous.length >= MIN_API_TEXT_CHARS && tail.length <= maxChars) {
    chunks[chunks.length - 2] = previous;
    chunks[chunks.length - 1] = tail;
  }
}

export function mergeChunkResults(lens, parts) {
  if (!Array.isArray(parts) || parts.length === 0) {
    throw new Error("The analysis returned no results.");
  }
  if (parts.length === 1) return parts[0].result;

  if (lens === "fallacies") return mergeFallacies(parts);
  if (lens === "facts") return mergeFacts(parts);
  if (lens === "neutrality") return mergeNeutrality(parts);
  throw new Error("Invalid analysis lens.");
}

function mergeFallacies(parts) {
  const fallacies = dedupe(
    parts.flatMap(({ result }) => result.fallacies || []),
    (item) => `${item.name}\u0000${item.excerpt}\u0000${item.explanation}`,
  );
  return {
    fallacies,
    fallacy_count: fallacies.length,
    verdict: fallacies.length > 0 ? "fallacies_found" : "clean",
  };
}

function mergeFacts(parts) {
  const claims = dedupe(
    parts.flatMap(({ result }) => result.claims || []),
    (item) => `${item.claim}\u0000${item.verdict}`,
  );
  const overall = parts.some(({ result }) => result.overall_verdict === "unreliable")
    ? "unreliable"
    : parts.some(({ result }) => result.overall_verdict === "questionable")
      ? "questionable"
      : "reliable";

  return {
    claims,
    overall_verdict: overall,
    truncated: parts.some(({ result }) => result.truncated === true),
  };
}

function mergeNeutrality(parts) {
  const totalWeight = parts.reduce((sum, part) => sum + part.charCount, 0) || 1;
  const score = parts.reduce(
    (sum, part) => sum + Number(part.result.score || 0) * part.charCount,
    0,
  ) / totalWeight;
  const roundedScore = Math.round(score * 100) / 100;
  const signals = dedupe(
    parts.flatMap(({ result }) => result.signals || []),
    (item) => `${item.type}\u0000${item.excerpt}\u0000${item.explanation}`,
  );
  const summaries = dedupe(
    parts.map(({ result }) => String(result.summary || "").trim()).filter(Boolean),
    (item) => item,
  );

  return {
    score: roundedScore,
    label: neutralityLabel(roundedScore),
    signals,
    summary: summaries.join(" "),
  };
}

function neutralityLabel(score) {
  if (score >= 0.75) return "neutral";
  if (score >= 0.5) return "mostly_neutral";
  if (score >= 0.25) return "biased";
  return "highly_biased";
}

function dedupe(items, keyFor) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const key = keyFor(item);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

export function friendlyApiError(status, payload, messages = {}) {
  const code = payload?.code;
  if (status === 401) return messages["api.unauthorized"] || "The API key is invalid or has been revoked.";
  if (status === 402) return messages["api.paymentRequired"] || "There are not enough credits for this analysis.";
  if (status === 429) return messages["api.rateLimited"] || "The analysis limit was reached. Try again shortly.";
  if (code === "text_too_long") return messages["api.textTooLong"] || "The passage is too long for the API.";
  if (status >= 500) return messages["api.unavailable"] || "Jiddu is temporarily unavailable. Try again.";
  return payload?.error || messages["api.default"] || "The analysis could not be completed.";
}
