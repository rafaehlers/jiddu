import { prisma } from "@/lib/db";
import { DEFAULT_LIVE_MINIMUM_CREDITS } from "@/lib/jiddu-credit-rates";

function positiveEnvironmentNumber(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// Defaults baked into the code. The admin can override any of these via
// /admin/settings; overrides are persisted in the AppSetting table and
// override the defaults on read. Add a new key here when you need a new
// admin-configurable knob.
//
// Number values are stored as plain JSON numbers. Bucket sizes match the
// in-memory rate-limit token bucket: `capacity` is the burst, `perHour`
// is the long-run rate (we convert to per-second internally).
export const DEFAULT_SETTINGS = {
  // Jiddu credit economics. Environment variables establish installation
  // defaults; persisted admin overrides are authoritative at runtime.
  "credits.marginMultiplier": positiveEnvironmentNumber(
    process.env.JIDDU_CREDIT_MARGIN_MULTIPLIER,
    1.5,
  ),
  "credits.usdPerCredit": positiveEnvironmentNumber(
    process.env.JIDDU_CREDIT_USD_VALUE,
    0.01,
  ),
  "credits.liveTranscription": positiveEnvironmentNumber(
    process.env.JIDDU_LIVE_MINIMUM_CREDITS ??
      process.env.JIDDU_LIVE_TRANSCRIPTION_CREDITS,
    DEFAULT_LIVE_MINIMUM_CREDITS,
  ),
  "credits.liveTranscriptionUsdPerMinute": positiveEnvironmentNumber(
    process.env.OPENAI_LIVE_TRANSCRIPTION_USD_PER_MINUTE,
    0.017,
  ),

  // Fallacy detector (POST /api/analyze)
  "rate.analyze.capacity": 10,
  "rate.analyze.perHour": 30,

  // Fact-check extraction (POST /api/factcheck)
  "rate.factcheck.capacity": 10,
  "rate.factcheck.perHour": 30,

  // Bulk verdict pass (POST /api/factcheck/[id]/verify) — expensive
  "rate.verify.capacity": 5,
  "rate.verify.perHour": 10,

  // Per-claim verdict refresh (POST /api/factcheck/[id]/claim/[claimId]/verify)
  "rate.singleVerify.capacity": 10,
  "rate.singleVerify.perHour": 20,

  // Full paper review: four long-context passes plus academic web search.
  "rate.review.capacity": 2,
  "rate.review.perHour": 4,

  // Live transcription token issuance. Applied per authenticated WorkOS user
  // before Jiddu asks OpenAI for an ephemeral Realtime client secret.
  "rate.liveToken.capacity": 2,
  "rate.liveToken.perHour": 6,

  // Live fallacy-analysis windows. The browser normally sends at most one
  // request every 30 seconds; this leaves room for normal retries while
  // bounding direct provider-funded calls.
  "rate.liveAnalyze.capacity": 6,
  "rate.liveAnalyze.perHour": 120,

  // Fact-check cost caps
  "factcheck.maxClaims": 50,
  "factcheck.maxRefreshPerClaim": 2,

  // Public REST/MCP API. REST buckets are per API key; hosted MCP buckets are
  // per WorkOS user. Both are independent of the web UI's per-IP limits.
  // Fact-check via the API does extract + verify (Sonar), so it gets a tighter
  // bucket and its own claim cap.
  "rate.api.capacity": 20,
  "rate.api.perHour": 60,
  "rate.apiFactcheck.capacity": 5,
  "rate.apiFactcheck.perHour": 15,
  "rate.apiReview.capacity": 1,
  "rate.apiReview.perHour": 4,
  "api.maxClaims": 10,
} as const;

export type SettingKey = keyof typeof DEFAULT_SETTINGS;

const KEYS = Object.keys(DEFAULT_SETTINGS) as SettingKey[];

export const PAPER_REVIEW_MODEL_OPTIONS = [
  "gpt-5.5",
  "claude-opus-4.8",
  "gpt-5.4-mini",
  "minimax-m3",
] as const;

export const LIVE_TRANSCRIPTION_DELAY_OPTIONS = [
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
] as const;

export type PaperReviewModelSetting =
  (typeof PAPER_REVIEW_MODEL_OPTIONS)[number];
export type LiveTranscriptionDelaySetting =
  (typeof LIVE_TRANSCRIPTION_DELAY_OPTIONS)[number];

function supportedStringDefault<T extends readonly string[]>(
  value: string | undefined,
  options: T,
  fallback: T[number],
): T[number] {
  const normalized = value?.trim();
  return normalized && options.includes(normalized) ? normalized : fallback;
}

export const DEFAULT_STRING_SETTINGS = {
  "paperReview.deepModel": supportedStringDefault(
    process.env.PAPER_REVIEW_DEEP_MODEL,
    PAPER_REVIEW_MODEL_OPTIONS,
    "gpt-5.5",
  ),
  "paperReview.criticModel": supportedStringDefault(
    process.env.PAPER_REVIEW_CRITIC_MODEL,
    PAPER_REVIEW_MODEL_OPTIONS,
    "claude-opus-4.8",
  ),
  "live.transcriptionDelay": supportedStringDefault(
    process.env.OPENAI_LIVE_TRANSCRIBE_DELAY,
    LIVE_TRANSCRIPTION_DELAY_OPTIONS,
    "medium",
  ),
} as const;

export type StringSettingKey = keyof typeof DEFAULT_STRING_SETTINGS;
export type StringSettings = {
  "paperReview.deepModel": PaperReviewModelSetting;
  "paperReview.criticModel": PaperReviewModelSetting;
  "live.transcriptionDelay": LiveTranscriptionDelaySetting;
};

const STRING_KEYS = Object.keys(
  DEFAULT_STRING_SETTINGS,
) as StringSettingKey[];

// In-process cache so we don't hit SQLite on every rate-limit check. The
// admin write path invalidates by calling `invalidateSettingsCache()`.
let cachedSnapshot: Record<SettingKey, number> | null = null;
let cachedStringSnapshot: StringSettings | null = null;
let cachedAt = 0;
let cachedStringsAt = 0;
const CACHE_TTL_MS = 30_000;

export async function loadSettings(): Promise<Record<SettingKey, number>> {
  const now = Date.now();
  if (cachedSnapshot && now - cachedAt < CACHE_TTL_MS) {
    return cachedSnapshot;
  }
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: KEYS } },
  });
  const overrides = new Map<string, number>();
  for (const r of rows) {
    try {
      const v = JSON.parse(r.value);
      if (typeof v === "number" && Number.isFinite(v)) {
        overrides.set(r.key, v);
      }
    } catch {
      // ignore malformed rows
    }
  }
  const snap = {} as Record<SettingKey, number>;
  for (const k of KEYS) {
    snap[k] = overrides.get(k) ?? DEFAULT_SETTINGS[k];
  }
  cachedSnapshot = snap;
  cachedAt = now;
  return snap;
}

export async function loadStringSettings(): Promise<StringSettings> {
  const now = Date.now();
  if (
    cachedStringSnapshot &&
    now - cachedStringsAt < CACHE_TTL_MS
  ) {
    return cachedStringSnapshot;
  }
  const rows = await prisma.appSetting.findMany({
    where: { key: { in: STRING_KEYS } },
  });
  const overrides = new Map<string, string>();
  for (const row of rows) {
    try {
      const value = JSON.parse(row.value);
      if (typeof value === "string") {
        overrides.set(row.key, value);
      }
    } catch {
      // Ignore malformed rows and use the installation default.
    }
  }
  const snap: StringSettings = {
    "paperReview.deepModel": supportedStringDefault(
      overrides.get("paperReview.deepModel"),
      PAPER_REVIEW_MODEL_OPTIONS,
      DEFAULT_STRING_SETTINGS["paperReview.deepModel"],
    ),
    "paperReview.criticModel": supportedStringDefault(
      overrides.get("paperReview.criticModel"),
      PAPER_REVIEW_MODEL_OPTIONS,
      DEFAULT_STRING_SETTINGS["paperReview.criticModel"],
    ),
    "live.transcriptionDelay": supportedStringDefault(
      overrides.get("live.transcriptionDelay"),
      LIVE_TRANSCRIPTION_DELAY_OPTIONS,
      DEFAULT_STRING_SETTINGS["live.transcriptionDelay"],
    ),
  };
  cachedStringSnapshot = snap;
  cachedStringsAt = now;
  return snap;
}

export function invalidateSettingsCache(): void {
  cachedSnapshot = null;
  cachedAt = 0;
  cachedStringSnapshot = null;
  cachedStringsAt = 0;
}

export async function setSetting(key: SettingKey, value: number): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value: JSON.stringify(value) },
    update: { value: JSON.stringify(value) },
  });
  invalidateSettingsCache();
}

export async function deleteSetting(key: SettingKey): Promise<void> {
  await prisma.appSetting.delete({ where: { key } }).catch(() => null);
  invalidateSettingsCache();
}

export function isPaperReviewModelSetting(
  value: string,
): value is PaperReviewModelSetting {
  return PAPER_REVIEW_MODEL_OPTIONS.some((option) => option === value);
}

export function isLiveTranscriptionDelaySetting(
  value: string,
): value is LiveTranscriptionDelaySetting {
  return LIVE_TRANSCRIPTION_DELAY_OPTIONS.some(
    (option) => option === value,
  );
}

export async function setStringSetting(
  key: StringSettingKey,
  value: StringSettings[StringSettingKey],
): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value: JSON.stringify(value) },
    update: { value: JSON.stringify(value) },
  });
  invalidateSettingsCache();
}

// Build the shape consumed by the rate-limit token bucket from a paired
// (capacity, perHour) setting.
export type RateBucketPrefix =
  | "rate.analyze"
  | "rate.factcheck"
  | "rate.verify"
  | "rate.singleVerify"
  | "rate.review"
  | "rate.liveToken"
  | "rate.liveAnalyze"
  | "rate.api"
  | "rate.apiFactcheck"
  | "rate.apiReview";

export function bucketFromSettings(
  s: Record<SettingKey, number>,
  prefix: RateBucketPrefix,
): { capacity: number; refillPerSec: number } {
  const cap = s[`${prefix}.capacity` as SettingKey];
  const perHour = s[`${prefix}.perHour` as SettingKey];
  return {
    capacity: Math.max(1, Math.floor(cap)),
    refillPerSec: Math.max(0, perHour / 3600),
  };
}

// Like bucketFromSettings but lets an individual API key override the global
// capacity / per-hour rate. Null overrides fall back to the global setting.
export function bucketFor(
  s: Record<SettingKey, number>,
  prefix: RateBucketPrefix,
  key: { rateCapacity: number | null; ratePerHour: number | null },
): { capacity: number; refillPerSec: number } {
  const base = bucketFromSettings(s, prefix);
  return {
    capacity:
      key.rateCapacity != null ? Math.max(1, Math.floor(key.rateCapacity)) : base.capacity,
    refillPerSec:
      key.ratePerHour != null ? Math.max(0, key.ratePerHour / 3600) : base.refillPerSec,
  };
}
