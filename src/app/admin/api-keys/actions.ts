"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { ADMIN_COOKIE_NAME, adminTokenIsValid } from "../auth";
import { generateKey } from "@/lib/api/auth";

// The freshly-minted secret is shown exactly once. We stash it in a short-
// lived httpOnly cookie (read by the page on the next render) instead of
// putting it in the redirect URL, so it never lands in browser history,
// proxy logs, or a Referer header.
export const NEW_KEY_COOKIE = "jiddu_new_api_key";

async function assertAdmin(): Promise<void> {
  const jar = await cookies();
  if (!adminTokenIsValid(jar.get(ADMIN_COOKIE_NAME)?.value)) {
    throw new Error("Forbidden");
  }
}

function parseOptInt(v: FormDataEntryValue | null): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (s === "") return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function createApiKeyAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const label = String(formData.get("label") ?? "").trim() || "Untitled key";
  const rateCapacity = parseOptInt(formData.get("rateCapacity"));
  const ratePerHour = parseOptInt(formData.get("ratePerHour"));

  const { secret, keyHash, prefix } = generateKey();
  await prisma.apiKey.create({
    data: { id: nanoid(12), keyHash, prefix, label, rateCapacity, ratePerHour },
  });

  const jar = await cookies();
  jar.set(NEW_KEY_COOKIE, secret, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 120,
    path: "/admin",
  });
  redirect("/admin/api-keys?created=1");
}

export async function revokeApiKeyAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.apiKey
      .update({ where: { id }, data: { revokedAt: new Date() } })
      .catch(() => {});
  }
  redirect("/admin/api-keys?revoked=1");
}
