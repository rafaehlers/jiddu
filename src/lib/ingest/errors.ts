export type IngestCode =
  | "blocked"          // 401/403 — site refuses bots / paywalled
  | "not_found"        // 404
  | "rate_limited"     // 429
  | "fetch_failed"     // 5xx / network
  | "timeout"          // exceeded fetch budget
  | "unreachable"      // dns/network error before HTTP
  | "extraction_failed" // got HTML but couldn't extract a body
  | "invalid_url"      // bad URL format
  | "too_short";       // text below the minimum threshold

export class IngestError extends Error {
  readonly code: IngestCode;
  readonly status?: number;
  constructor(code: IngestCode, message: string, status?: number) {
    super(message);
    this.name = "IngestError";
    this.code = code;
    this.status = status;
  }
}
