import * as Sentry from "@sentry/nextjs";
import { sentryBaseOptions } from "@/lib/sentry-options";

// Browser error monitoring. No tracing and no Session Replay: only uncaught
// errors and unhandled rejections, scrubbed in src/lib/sentry-options.ts.
Sentry.init(sentryBaseOptions());
