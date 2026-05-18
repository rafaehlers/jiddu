import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { consume, ipFromRequest, rateLimitResponse } from "@/lib/rate-limit";
import type { Claim } from "@/lib/claims-schema";
import type { Verdict } from "@/lib/verdict-schema";

export const runtime = "nodejs";

// Feedback is cheap to record but easy to abuse. Limit per IP: 20/hour
// burst of 10 — enough for legitimate "I disagree with these 3 verdicts in
// the same article" sessions, not enough for spam.
const FEEDBACK_RATE = { capacity: 10, refillPerSec: 20 / 3600 };
const MAX_REASON_CHARS = 1_000;

type ClaimWithId = Claim & { id: string };

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; claimId: string }> },
) {
  const ip = ipFromRequest(req);
  const rl = consume(`feedback:${ip}`, FEEDBACK_RATE);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

  const { id, claimId } = await ctx.params;

  const body = (await req.json().catch(() => null)) as
    | { reason?: string }
    | null;
  const reason =
    typeof body?.reason === "string"
      ? body.reason.trim().slice(0, MAX_REASON_CHARS)
      : "";

  const fc = await prisma.factCheck.findUnique({ where: { id } });
  if (!fc) return jsonError("Not found", 404);

  const claims = JSON.parse(fc.claims) as ClaimWithId[];
  const claim = claims.find((c) => c.id === claimId);
  if (!claim) return jsonError("Claim not found", 404);

  const verdicts = JSON.parse(fc.verdicts) as Verdict[];
  const verdict = verdicts.find((v) => v.claimId === claimId);
  // Allow feedback even when there's no verdict yet — the user might be
  // disagreeing with the claim extraction or just flagging something off.

  await prisma.verdictFeedback.create({
    data: {
      factCheckId: id,
      claimId,
      statement: claim.statement,
      verdictSnapshot: JSON.stringify(verdict ?? null),
      userReason: reason || null,
      ip,
    },
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}
