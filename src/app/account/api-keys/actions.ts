"use server";

import { withAuth } from "@workos-inc/authkit-nextjs";
import { nanoid } from "nanoid";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { generateKey } from "@/lib/api/auth";
import { prisma } from "@/lib/db";
import { ACCOUNT_NEW_KEY_COOKIE } from "./cookie";

const MAX_ACTIVE_API_KEYS = 5;
const MAX_API_KEY_CREATIONS_PER_HOUR = 10;

async function requireAccountUser() {
  const { user } = await withAuth();
  if (!user) redirect("/login?returnTo=/account?tab=api");
  return user;
}

export async function createAccountApiKeyAction(
  formData: FormData,
): Promise<void> {
  const user = await requireAccountUser();
  if (!user.emailVerified) {
    redirect("/account?tab=api&error=email_unverified");
  }

  const label = String(formData.get("label") ?? "").trim();
  if (label.length < 1 || label.length > 80) {
    redirect("/account?tab=api&error=invalid_label");
  }

  const [activeKeyCount, recentCreationCount] = await Promise.all([
    prisma.apiKey.count({
      where: { ownerWorkosUserId: user.id, revokedAt: null },
    }),
    prisma.apiKey.count({
      where: {
        ownerWorkosUserId: user.id,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    }),
  ]);
  if (activeKeyCount >= MAX_ACTIVE_API_KEYS) {
    redirect("/account?tab=api&error=active_limit");
  }
  if (recentCreationCount >= MAX_API_KEY_CREATIONS_PER_HOUR) {
    redirect("/account?tab=api&error=rate_limit");
  }

  const { secret, keyHash, prefix } = generateKey();
  await prisma.apiKey.create({
    data: {
      id: nanoid(12),
      keyHash,
      prefix,
      label,
      ownerWorkosUserId: user.id,
      ownerEmail: user.email.trim().toLowerCase(),
    },
  });

  const jar = await cookies();
  jar.set(ACCOUNT_NEW_KEY_COOKIE, secret, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 120,
    path: "/account",
  });
  redirect("/account?tab=api&created=1");
}

export async function revokeAccountApiKeyAction(
  formData: FormData,
): Promise<void> {
  const user = await requireAccountUser();
  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await prisma.apiKey.updateMany({
      where: {
        id,
        ownerWorkosUserId: user.id,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }
  redirect("/account?tab=api&revoked=1");
}
