// Small shared helpers for the public REST API (POST /api/v1/*).

import type { Lang } from "@/lib/fallacies";
import { IngestError } from "@/lib/ingest/errors";
import { NoUnitsError } from "./run";

export const MAX_API_TEXT_CHARS = 2000;
export const MIN_API_TEXT_CHARS = 40; // matches ingestText's floor

export function jsonError(message: string, status: number, code?: string): Response {
  return new Response(
    JSON.stringify(code ? { error: message, code } : { error: message }),
    { status, headers: { "content-type": "application/json" } },
  );
}

export function normalizeLang(v: unknown): Lang {
  const s = typeof v === "string" ? v.toLowerCase() : undefined;
  if (s === "en" || s === "pt" || s === "es") return s;
  return "en";
}

// Validate and extract the `text` field shared by every v1 endpoint. Returns
// the trimmed-but-not-yet-cleaned text, or a ready-to-return error Response.
export function readText(body: unknown): string | Response {
  const text = (body as { text?: unknown } | null)?.text;
  if (typeof text !== "string") {
    return jsonError("`text` is required and must be a string", 400, "bad_request");
  }
  if (text.length > MAX_API_TEXT_CHARS) {
    return jsonError(
      `\`text\` exceeds the ${MAX_API_TEXT_CHARS}-character limit`,
      400,
      "text_too_long",
    );
  }
  return text;
}

// Translate an error thrown by a run* function into a clean API Response.
export function mapRunError(err: unknown): Response {
  if (err instanceof IngestError) {
    return jsonError(err.message, 422, err.code);
  }
  if (err instanceof NoUnitsError) {
    return jsonError(err.message, 422, "no_content");
  }
  const message = err instanceof Error ? err.message : "Analysis failed";
  // Don't leak missing-credential details to public callers.
  if (message.includes("OPENROUTER_API_KEY")) {
    return jsonError("Upstream model provider unavailable", 503, "upstream_unavailable");
  }
  return jsonError(message, 502, "analysis_failed");
}
