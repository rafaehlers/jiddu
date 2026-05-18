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

export async function resolveFeedbackAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || (status !== "resolved" && status !== "ignored")) return;
  await prisma.verdictFeedback
    .update({
      where: { id },
      data: { status, resolvedAt: new Date() },
    })
    .catch(() => null);
  revalidatePath("/admin/feedback");
}

export async function deleteFeedbackAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.verdictFeedback.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/feedback");
}
