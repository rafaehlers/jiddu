// API-key authentication for the public REST API (POST /api/v1/*).
//
// Keys are admin-issued (see /admin/api-keys). We store only a sha256 hash of
// the secret — the plaintext is shown exactly once at creation. Lookup is by
// hash, so the DB read is the comparison; we still hash with the same
// primitive used for the admin cookie (src/app/admin/auth.ts) for consistency.

import { createHash } from "node:crypto";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";

export const API_KEY_HEADER = "x-jiddu-key";

export function hashKey(secret: string): string {
  return createHash("sha256").update(`jiddu-api:${secret}`).digest("hex");
}

// Mint a fresh key. The secret is returned once to the caller (admin UI) and
// never persisted in plaintext.
export function generateKey(): { secret: string; keyHash: string; prefix: string } {
  const secret = `jdk_${nanoid(32)}`; // jdk_ = "jiddu key"
  return { secret, keyHash: hashKey(secret), prefix: secret.slice(0, 12) };
}

export type ApiKeyRecord = {
  id: string;
  label: string;
  rateCapacity: number | null;
  ratePerHour: number | null;
};

// Returns the authenticated key record, or a ready-to-return 401 Response.
// Usage in a route: `const auth = await requireApiKey(req); if (auth instanceof Response) return auth;`
export async function requireApiKey(req: Request): Promise<ApiKeyRecord | Response> {
  const provided = req.headers.get(API_KEY_HEADER)?.trim();
  if (!provided) {
    return unauthorized("Missing X-Jiddu-Key header");
  }
  const row = await prisma.apiKey.findUnique({
    where: { keyHash: hashKey(provided) },
  });
  if (!row || row.revokedAt) {
    return unauthorized("Invalid or revoked API key");
  }
  // Fire-and-forget last-used bump — never block the request on it.
  prisma.apiKey
    .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});
  return {
    id: row.id,
    label: row.label,
    rateCapacity: row.rateCapacity,
    ratePerHour: row.ratePerHour,
  };
}

function unauthorized(message: string): Response {
  return new Response(JSON.stringify({ error: message, code: "unauthorized" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}
