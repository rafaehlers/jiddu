// Read-side wrapper for OpenRouter's /credits endpoint. Used by the admin
// page so the operator can see how much budget is left without leaving
// Jiddu. The response is small but we cache it for a few minutes — admin
// refreshes shouldn't pound the credits endpoint.

const CREDITS_URL = "https://openrouter.ai/api/v1/credits";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export type CreditsSnapshot = {
  totalCredits: number;
  totalUsage: number;
  remaining: number;
  fetchedAt: Date;
};

type CacheEntry = {
  snapshot: CreditsSnapshot;
  cachedAt: number;
};

let cache: CacheEntry | null = null;

export async function getOpenRouterCredits(opts?: {
  force?: boolean;
}): Promise<CreditsSnapshot | { error: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { error: "OPENROUTER_API_KEY is not set" };
  }

  if (!opts?.force && cache && Date.now() - cache.cachedAt < CACHE_TTL_MS) {
    return cache.snapshot;
  }

  let res: Response;
  try {
    res = await fetch(CREDITS_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
      // Don't cache at the Next.js fetch layer; we manage cache ourselves.
      cache: "no-store",
    });
  } catch (err) {
    return {
      error: `Failed to reach OpenRouter: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (!res.ok) {
    return { error: `OpenRouter returned ${res.status} ${res.statusText}` };
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { error: "OpenRouter returned non-JSON response" };
  }

  const data =
    body && typeof body === "object" && "data" in body
      ? (body as { data: unknown }).data
      : null;
  if (
    !data ||
    typeof data !== "object" ||
    !("total_credits" in data) ||
    !("total_usage" in data)
  ) {
    return { error: "Unexpected response shape from OpenRouter /credits" };
  }
  const d = data as { total_credits: unknown; total_usage: unknown };
  const totalCredits = typeof d.total_credits === "number" ? d.total_credits : NaN;
  const totalUsage = typeof d.total_usage === "number" ? d.total_usage : NaN;
  if (!Number.isFinite(totalCredits) || !Number.isFinite(totalUsage)) {
    return { error: "OpenRouter credits/usage are not numeric" };
  }

  const snapshot: CreditsSnapshot = {
    totalCredits,
    totalUsage,
    remaining: totalCredits - totalUsage,
    fetchedAt: new Date(),
  };
  cache = { snapshot, cachedAt: Date.now() };
  return snapshot;
}

export function isCreditsSnapshot(
  v: CreditsSnapshot | { error: string },
): v is CreditsSnapshot {
  return "remaining" in v;
}
