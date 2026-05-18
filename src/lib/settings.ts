import { prisma } from "@/lib/db";

// Defaults baked into the code. The admin can override any of these via
// /admin/settings; overrides are persisted in the AppSetting table and
// override the defaults on read. Add a new key here when you need a new
// admin-configurable knob.
//
// Number values are stored as plain JSON numbers. Bucket sizes match the
// in-memory rate-limit token bucket: `capacity` is the burst, `perHour`
// is the long-run rate (we convert to per-second internally).
export const DEFAULT_SETTINGS = {
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

  // Fact-check cost caps
  "factcheck.maxClaims": 50,
  "factcheck.maxRefreshPerClaim": 2,
} as const;

export type SettingKey = keyof typeof DEFAULT_SETTINGS;

const KEYS = Object.keys(DEFAULT_SETTINGS) as SettingKey[];

// In-process cache so we don't hit SQLite on every rate-limit check. The
// admin write path invalidates by calling `invalidateSettingsCache()`.
let cachedSnapshot: Record<SettingKey, number> | null = null;
let cachedAt = 0;
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

export function invalidateSettingsCache(): void {
  cachedSnapshot = null;
  cachedAt = 0;
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

// Build the shape consumed by the rate-limit token bucket from a paired
// (capacity, perHour) setting.
export function bucketFromSettings(
  s: Record<SettingKey, number>,
  prefix: "rate.analyze" | "rate.factcheck" | "rate.verify" | "rate.singleVerify",
): { capacity: number; refillPerSec: number } {
  const cap = s[`${prefix}.capacity` as SettingKey];
  const perHour = s[`${prefix}.perHour` as SettingKey];
  return {
    capacity: Math.max(1, Math.floor(cap)),
    refillPerSec: Math.max(0, perHour / 3600),
  };
}
