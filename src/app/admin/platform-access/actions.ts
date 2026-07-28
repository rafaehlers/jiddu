"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdminUser } from "@/lib/admin-auth";
import { normalizeAccessEmail } from "@/lib/access-policy";
import { prisma } from "@/lib/db";

function readEmail(formData: FormData): string | null {
  const email = normalizeAccessEmail(String(formData.get("email") ?? ""));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export async function createPlatformAccessAction(
  formData: FormData,
): Promise<void> {
  await assertAdminUser();
  const email = readEmail(formData);
  if (!email) redirect("/admin/platform-access?error=invalid_email");

  await prisma.platformAccessGrant.upsert({
    where: { email },
    create: { email },
    update: {},
  });
  revalidatePath("/admin/platform-access");
  redirect("/admin/platform-access?created=1");
}

export async function updatePlatformAccessAction(
  formData: FormData,
): Promise<void> {
  await assertAdminUser();
  const id = String(formData.get("id") ?? "");
  const email = readEmail(formData);
  if (!id || !email) {
    redirect("/admin/platform-access?error=invalid_email");
  }

  const duplicate = await prisma.platformAccessGrant.findUnique({
    where: { email },
    select: { id: true },
  });
  if (duplicate && duplicate.id !== id) {
    redirect("/admin/platform-access?error=duplicate");
  }

  await prisma.platformAccessGrant.update({
    where: { id },
    data: { email },
  });
  revalidatePath("/admin/platform-access");
  redirect("/admin/platform-access?updated=1");
}

export async function deletePlatformAccessAction(
  formData: FormData,
): Promise<void> {
  await assertAdminUser();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.platformAccessGrant.delete({ where: { id } }).catch(() => null);
  }
  revalidatePath("/admin/platform-access");
  redirect("/admin/platform-access?deleted=1");
}
