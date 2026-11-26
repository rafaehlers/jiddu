import type { Breadcrumb, ErrorEvent } from "@sentry/nextjs";
import { normalizeBuildVersion } from "./build-version";

// Shared by the browser, Node.js and Edge Sentry initialisers. Keep this file
// free of Node-only imports.
//
// Privacy contract: Sentry receives error metadata (stack traces, route,
// release, runtime) and a sample of performance spans (timings, route, model
// id, token counts). Submitted text, prompts, model output, request bodies,
// cookies, headers, query strings and user identity are never sent. See
// src/lib/policy-pages-copy.ts ("Service providers") for the public promise.

const MAX_MESSAGE_LENGTH = 300;
const DEFAULT_TRACES_SAMPLE_RATE = 0.1;

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

type StreamedSpan = Parameters<
  NonNullable<SentryInitOptions["beforeSendSpan"]>
>[0];

// Span attributes that could carry submitted text, model I/O, identity or
// headers. dataCollection should already keep them out; this is the backstop.
const SENSITIVE_SPAN_ATTRIBUTE =
  /(^|\.)(query|query_string|cookies?|headers?|body)(\.|$)|^user\.|^http\.(request|response)\.header|^gen_ai\.(input|output|prompt|system_instructions|request\.messages|response\.text|tool\.(input|output|call\.arguments|call\.result))|^mcp\.(request|response)\.(argument|result)/;

// Accepts "0".."1"; anything else falls back to 10% of traces.
export function resolveTracesSampleRate(value: string | undefined): number {
  if (value === undefined || value.trim() === "") return DEFAULT_TRACES_SAMPLE_RATE;
  const rate = Number(value);
  return Number.isFinite(rate) && rate >= 0 && rate <= 1
    ? rate
    : DEFAULT_TRACES_SAMPLE_RATE;
}

// Errors plus a 10% sample of traces (LLM call timing, routes, database).
// Session Replay and logs stay off so no page content is recorded.
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
    tracesSampleRate: resolveTracesSampleRate(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
    ),
    beforeSend: scrubSentryEvent,
    beforeSendSpan: scrubSentrySpan,
    beforeBreadcrumb: scrubSentryBreadcrumb,
  } satisfies SentryInitOptions;
}

export function stripQuery(url: string | undefined): string | undefined {
  if (!url) return url;
  const cut = url.search(/[?#]/);
  return cut === -1 ? url : url.slice(0, cut);
}

function stripQueryInText(value: string): string {
  return value.replace(/([^\s?#]*)[?#][^\s]*/g, "$1");
}

// Attribute keys whose string values may be URLs or paths with query strings.
const URL_LIKE_SPAN_ATTRIBUTE =
  /(^|\.)(url|uri)(\.|$)|(^|\.)(target|route|name|path)$|^http\./;

export function scrubSentrySpan(span: StreamedSpan): StreamedSpan {
  span.name = stripQueryInText(span.name);

  const attributes = span.attributes as Record<string, unknown>;
  for (const [key, raw] of Object.entries(attributes)) {
    if (SENSITIVE_SPAN_ATTRIBUTE.test(key)) {
      delete attributes[key];
    } else if (URL_LIKE_SPAN_ATTRIBUTE.test(key)) {
      attributes[key] = scrubUrlAttribute(raw);
    }
  }

  return span;
}

// Raw attributes are either primitives or `{ value, type, unit? }` objects.
function scrubUrlAttribute(raw: unknown): unknown {
  if (typeof raw === "string") return stripQueryInText(raw);
  if (
    raw !== null &&
    typeof raw === "object" &&
    typeof (raw as { value?: unknown }).value === "string"
  ) {
    const typed = raw as { value: string };
    return { ...typed, value: stripQueryInText(typed.value) };
  }
  return raw;
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
