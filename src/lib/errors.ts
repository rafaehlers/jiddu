import type { IngestCode } from "./ingest/errors";

// Thin client-side mirror of the server-side IngestError so error UIs can
// branch on a discriminator without coupling to internals.
export class SubmitError extends Error {
  readonly code?: IngestCode | "request_failed" | "stream_failed";
  readonly status?: number;
  constructor(
    message: string,
    code?: IngestCode | "request_failed" | "stream_failed",
    status?: number,
  ) {
    super(message);
    this.name = "SubmitError";
    this.code = code;
    this.status = status;
  }
}
