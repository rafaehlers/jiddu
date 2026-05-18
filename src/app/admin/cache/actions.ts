"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ADMIN_COOKIE_NAME, adminTokenIsValid } from "../auth";

async function assertAdmin(): Promise<void> {
  const jar = await cookies();
  if (!adminTokenIsValid(jar.get(ADMIN_COOKIE_NAME)?.value)) {
    throw new Error("Forbidden");
  }
}

export async function deleteCacheEntryAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const hash = String(formData.get("hash") ?? "");
  if (!hash) return;
  await prisma.claimVerdict.delete({ where: { hash } }).catch(() => null);
  revalidatePath("/admin/cache");
}

export async function deleteExpiredCacheAction(): Promise<void> {
  await assertAdmin();
  await prisma.claimVerdict.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  revalidatePath("/admin/cache");
}
