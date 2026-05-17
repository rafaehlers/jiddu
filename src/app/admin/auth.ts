import { createHash, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE_NAME = "jiddu_admin";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function tokenForPassword(password: string): string {
  return createHash("sha256").update(`jiddu-admin:${password}`).digest("hex");
}

export function adminTokenIsValid(token: string | undefined): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !token) return false;
  const expectedToken = tokenForPassword(expected);
  const a = Buffer.from(token);
  const b = Buffer.from(expectedToken);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
