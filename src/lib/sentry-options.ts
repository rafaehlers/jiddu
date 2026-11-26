import type { Breadcrumb, ErrorEvent } from "@sentry/nextjs";
import { normalizeBuildVersion } from "./build-version";

// Shared by the browser, Node.js and Edge Sentry initialisers. Keep this file
// free of Node-only imports.
//
// Privacy contract: Sentry receives error metadata only — stack traces, route,
// release and runtime. Submitted text, model output, request bodies, cookies,
// headers, query strings and user identity are never sent. See
// src/lib/policy-pages-copy.ts ("Service providers") for the public promise.

const MAX_MESSAGE_LENGTH = 300;

type SentryInitOptions = Parameters<typeof import("@sentry/nextjs").init>[0];

// SDK v11 replaced `sendDefaultPii` with `dataCollection`, whose defaults
// collect user info, cookies, headers, HTTP bodies, query strings and AI
// prompts/responses. Deny all of it explicitly; beforeSend is a second layer.
const SENTRY_DATA_COLLECTION = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  graphQL: { document: false, variables: false },
  genAI: { inputs: false, outputs: false },
  mcp: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  stackFrameVariables: false,
} satisfies NonNullable<SentryInitOptions["dataCollection"]>;

// Error-only monitoring. Tracing, Session Replay and logs stay off so the
// free-tier quota is spent on failures and no page content is recorded.
export function sentryBaseOptions() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || undefined;
  const buildVersion = normalizeBuildVersion(
    process.env.NEXT_PUBLIC_JIDDU_BUILD_VERSION,
  );

  return {
    dsn,
    enabled: Boolean(dsn),
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT?.trim() ||
      process.env.NODE_ENV,
    release: buildVersion ? `jiddu@${buildVersion.split(" ")[2]}` : undefined,
    dataCollection: SENTRY_DATA_COLLECTION,
    tracesSampleRate: 0,
    beforeSend: scrubSentryEvent,
    beforeBreadcrumb: scrubSentryBreadcrumb,
  } satisfies SentryInitOptions;
}

export function stripQuery(url: string | undefined): string | undefined {
  if (!url) return url;
  const cut = url.search(/[?#]/);
  return cut === -1 ? url : url.slice(0, cut);
}

function truncate(value: string | undefined): string | undefined {
  if (!value || value.length <= MAX_MESSAGE_LENGTH) return value;
  return `${value.slice(0, MAX_MESSAGE_LENGTH)}… [truncated]`;
}

export function scrubSentryEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    event.request = {
      method: event.request.method,
      url: stripQuery(event.request.url),
    };
  }

  delete event.user;
  delete event.extra;
  delete event.server_name;

  // Error messages can quote submitted text or model output (for example a
  // JSON parse failure). Keep the start, which identifies the failure.
  if (event.message) event.message = truncate(event.message);
  for (const exception of event.exception?.values ?? []) {
    exception.value = truncate(exception.value);
  }

  // Local variable capture would expose prompts and documents.
  for (const exception of event.exception?.values ?? []) {
    for (const frame of exception.stacktrace?.frames ?? []) {
      delete frame.vars;
    }
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs
      .map((breadcrumb) => scrubSentryBreadcrumb(breadcrumb))
      .filter((breadcrumb): breadcrumb is Breadcrumb => breadcrumb !== null);
  }

  return event;
}

export function scrubSentryBreadcrumb(
  breadcrumb: Breadcrumb,
): Breadcrumb | null {
  // Console output can include documents, prompts and model responses.
  if (breadcrumb.category === "console") return null;

  if (breadcrumb.category === "fetch" || breadcrumb.category === "xhr") {
    const data = breadcrumb.data ?? {};
    return {
      ...breadcrumb,
      data: {
        method: data.method,
        url: stripQuery(typeof data.url === "string" ? data.url : undefined),
        status_code: data.status_code,
      },
    };
  }

  if (breadcrumb.category === "navigation") {
    const data = breadcrumb.data ?? {};
    return {
      ...breadcrumb,
      data: {
        from: stripQuery(typeof data.from === "string" ? data.from : undefined),
        to: stripQuery(typeof data.to === "string" ? data.to : undefined),
      },
    };
  }

  if (breadcrumb.message) {
    return { ...breadcrumb, message: truncate(breadcrumb.message) };
  }

  return breadcrumb;
}
