// Tiny in-memory token-bucket rate limiter, scoped per key (typically IP).
//
// Jiddu runs as a single container on a Hostinger VPS, so in-memory state
// is fine — if we ever scale horizontally we'd swap this for Redis / KV.
//
// Each bucket is keyed by (route, identifier). The bucket holds `capacity`
// tokens and refills at `refillPerSec`. A request consumes one token; if
// the bucket is empty the request is denied.

type Bucket = {
  tokens: number;
  lastRefillMs: number;
};

const buckets = new Map<string, Bucket>();

// Periodically prune stale buckets so memory doesn't grow unbounded.
const PRUNE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const PRUNE_AFTER_MS = 60 * 60 * 1000; // 1 hour idle

let pruneTimer: ReturnType<typeof setInterval> | null = null;
function ensurePruner() {
  if (pruneTimer) return;
  pruneTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, b] of buckets) {
      if (now - b.lastRefillMs > PRUNE_AFTER_MS) buckets.delete(key);
    }
  }, PRUNE_INTERVAL_MS);
  // Don't keep the process alive just for the pruner.
  if (typeof pruneTimer.unref === "function") pruneTimer.unref();
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
};

export function consume(
  key: string,
  opts: { capacity: number; refillPerSec: number },
): RateLimitResult {
  ensurePruner();
  const now = Date.now();
  let b = buckets.get(key);
  if (!b) {
    b = { tokens: opts.capacity, lastRefillMs: now };
    buckets.set(key, b);
  } else {
    const elapsedSec = (now - b.lastRefillMs) / 1000;
    b.tokens = Math.min(opts.capacity, b.tokens + elapsedSec * opts.refillPerSec);
    b.lastRefillMs = now;
  }
  if (b.tokens >= 1) {
    b.tokens -= 1;
    return {
      allowed: true,
      remaining: Math.floor(b.tokens),
      retryAfterSec: 0,
    };
  }
  // Need (1 - b.tokens) more tokens at refillPerSec.
  const retryAfterSec = Math.ceil((1 - b.tokens) / opts.refillPerSec);
  return { allowed: false, remaining: 0, retryAfterSec };
}

// Extract the client IP from a Next.js request. Falls back to a literal
// when nothing is set (local dev). We honour X-Forwarded-For when the app
// runs behind a reverse proxy (Nginx Proxy Manager on the VPS sets it).
export function ipFromRequest(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "anon";
}

export function rateLimitResponse(retryAfterSec: number): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again shortly.",
      code: "rate_limited",
      retry_after_seconds: retryAfterSec,
    }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(retryAfterSec),
      },
    },
  );
}
