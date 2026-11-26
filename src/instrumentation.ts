import * as Sentry from "@sentry/nextjs";
import { sentryBaseOptions } from "@/lib/sentry-options";

// Runs once per server instance (Node.js and Edge). Without
// NEXT_PUBLIC_SENTRY_DSN the SDK stays disabled and sends nothing.
export function register() {
  Sentry.init(sentryBaseOptions());
}

// Reports errors from Server Components, Route Handlers, Server Actions and
// the proxy. Request headers are dropped by the beforeSend scrubber.
export const onRequestError = Sentry.captureRequestError;
