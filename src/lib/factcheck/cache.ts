import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import type { Verdict } from "@/lib/verdict-schema";
import type { ClaimType } from "@/lib/claims-schema";

// TTL per claim type, in milliseconds. Roadmap §3a:
//   numeric  → 30 days  (data revisions are common — IBGE re-baselines)
//   date     → 365 days (historical facts don't move)
//   quote    → 90 days  (attribution can be re-examined)
//   causal   → 90 days  (relationships may be reassessed)
//   categorical → 365 days (definitions / identities are stable)
const TTL_MS: Record<ClaimType, number> = {
  numeric: 30 * 24 * 60 * 60 * 1000,
  date: 365 * 24 * 60 * 60 * 1000,
  quote: 90 * 24 * 60 * 60 * 1000,
  causal: 90 * 24 * 60 * 60 * 1000,
  categorical: 365 * 24 * 60 * 60 * 1000,
};

const DEFAULT_TTL_MS = 90 * 24 * 60 * 60 * 1000;

// Normalize statements so trivial wording variants hit the same cache row.
// We lowercase, strip diacritics, collapse whitespace, drop trailing
// punctuation, and remove zero-width characters. Aggressive enough to
// catch reformulations like "PIB cresceu 2,9% em 2024" vs "O PIB cresceu
// 2,9% em 2024." but not so aggressive that distinct claims collide.
export function normalizeForHash(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .replace(/[​-‍﻿]/g, "") // zero-width characters
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?…]+\s*$/g, "")
    .trim();
}

export function claimCacheKey(statement: string, lang: string): string {
  const normalized = normalizeForHash(statement);
  return createHash("sha256").update(`${lang}:${normalized}`).digest("hex");
}

export type CachedVerdict = Verdict & { cached: true; cachedAt: Date };

export async function getCachedVerdict(
  hash: string,
): Promise<CachedVerdict | null> {
  // Piggyback the expired sweep on a cache lookup. The function rate-limits
  // itself so this is essentially free on the hot path.
  maybeSweepExpired();
  const row = await prisma.claimVerdict.findUnique({ where: { hash } });
  if (!row) return null;
  if (row.expiresAt.getTime() <= Date.now()) return null;
  let sources: Verdict["sources"];
  try {
    sources = JSON.parse(row.sources);
  } catch {
    sources = [];
  }
  return {
    cached: true,
    cachedAt: row.cachedAt,
    claimId: "", // caller fills this from the live claim
    verdict: row.verdict as Verdict["verdict"],
    confidence: row.confidence,
    rationale: row.rationale,
    sources,
    model: row.verifyModel,
  };
}

// Opportunistic sweep of expired verdict rows. Runs at most once every
// 30 minutes — anyone can call this on a hot path (we do it from
// `getCachedVerdict` on a miss) and only one process actually issues the
// DELETE. The sweep is fire-and-forget; failures are logged and ignored.
const SWEEP_INTERVAL_MS = 30 * 60 * 1000;
let lastSweepAt = 0;
let sweepRunning = false;

export function maybeSweepExpired(): void {
  const now = Date.now();
  if (sweepRunning) return;
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  sweepRunning = true;
  lastSweepAt = now;
  // Detach from the calling request — sweeping in the background.
  void prisma.claimVerdict
    .deleteMany({ where: { expiresAt: { lt: new Date() } } })
    .then((res) => {
      if (res.count > 0) {
        console.log(
          `[claim-verdict-cache] swept ${res.count} expired row(s)`,
        );
      }
    })
    .catch((err) => {
      console.warn("[claim-verdict-cache] sweep failed:", err);
    })
    .finally(() => {
      sweepRunning = false;
    });
}

export async function putCachedVerdict(
  hash: string,
  claim: { statement: string; type: ClaimType },
  verdict: Verdict,
  lang: string,
): Promise<void> {
  const ttl = TTL_MS[claim.type] ?? DEFAULT_TTL_MS;
  const expiresAt = new Date(Date.now() + ttl);
  await prisma.claimVerdict.upsert({
    where: { hash },
    create: {
      hash,
      statement: claim.statement,
      language: lang,
      type: claim.type,
      verdict: verdict.verdict,
      confidence: verdict.confidence,
      rationale: verdict.rationale,
      sources: JSON.stringify(verdict.sources),
      verifyModel: verdict.model,
      expiresAt,
    },
    update: {
      statement: claim.statement,
      type: claim.type,
      verdict: verdict.verdict,
      confidence: verdict.confidence,
      rationale: verdict.rationale,
      sources: JSON.stringify(verdict.sources),
      verifyModel: verdict.model,
      cachedAt: new Date(),
      expiresAt,
    },
  });
}
