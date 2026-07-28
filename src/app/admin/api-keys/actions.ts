"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { assertAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { generateKey } from "@/lib/api/auth";
import { findWorkOSUserByEmail } from "@/lib/workos-users";
import { NEW_KEY_COOKIE } from "./cookie";

// The freshly-minted secret is shown exactly once. We stash it in a short-
// lived httpOnly cookie (read by the page on the next render) instead of
// putting it in the redirect URL, so it never lands in browser history,
// proxy logs, or a Referer header.

function parseOptInt(v: FormDataEntryValue | null): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (s === "") return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function createApiKeyAction(formData: FormData): Promise<void> {
  await assertAdminUser();
  const label = String(formData.get("label") ?? "").trim() || "Untitled key";
  const ownerEmail = String(formData.get("ownerEmail") ?? "")
    .trim()
    .toLowerCase();
  const rateCapacity = parseOptInt(formData.get("rateCapacity"));
  const ratePerHour = parseOptInt(formData.get("ratePerHour"));
  const owner = await findWorkOSUserByEmail(ownerEmail);
  if (!owner) redirect("/admin/api-keys?error=owner_not_found");
  if (!owner.emailVerified) {
    redirect("/admin/api-keys?error=owner_unverified");
  }

  const { secret, keyHash, prefix } = generateKey();
  await prisma.apiKey.create({
    data: {
      id: nanoid(12),
      keyHash,
      prefix,
      label,
      ownerWorkosUserId: owner.id,
      ownerEmail: owner.email.trim().toLowerCase(),
      rateCapacity,
      ratePerHour,
    },
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

export async function assignApiKeyOwnerAction(
  formData: FormData,
): Promise<void> {
  await assertAdminUser();
  const id = String(formData.get("id") ?? "");
  const ownerEmail = String(formData.get("ownerEmail") ?? "")
    .trim()
    .toLowerCase();
  const owner = await findWorkOSUserByEmail(ownerEmail);
  if (!id || !owner) redirect("/admin/api-keys?error=owner_not_found");
  if (!owner.emailVerified) {
    redirect("/admin/api-keys?error=owner_unverified");
  }

  await prisma.apiKey.update({
    where: { id },
    data: {
      ownerWorkosUserId: owner.id,
      ownerEmail: owner.email.trim().toLowerCase(),
    },
  });
  redirect("/admin/api-keys?assigned=1");
}

export async function revokeApiKeyAction(formData: FormData): Promise<void> {
  await assertAdminUser();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.apiKey
      .update({ where: { id }, data: { revokedAt: new Date() } })
      .catch(() => {});
  }
  redirect("/admin/api-keys?revoked=1");
}
