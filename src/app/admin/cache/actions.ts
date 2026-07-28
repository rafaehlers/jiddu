"use server";

import { revalidatePath } from "next/cache";
import { assertAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export async function deleteCacheEntryAction(formData: FormData): Promise<void> {
  await assertAdminUser();
  const hash = String(formData.get("hash") ?? "");
  if (!hash) return;
  await prisma.claimVerdict.delete({ where: { hash } }).catch(() => null);
  revalidatePath("/admin/cache");
}

export async function deleteExpiredCacheAction(): Promise<void> {
  await assertAdminUser();
  await prisma.claimVerdict.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  revalidatePath("/admin/cache");
}
