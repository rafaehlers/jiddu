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
