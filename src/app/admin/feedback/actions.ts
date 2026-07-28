"use server";

import { revalidatePath } from "next/cache";
import { assertAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export async function resolveFeedbackAction(formData: FormData): Promise<void> {
  await assertAdminUser();
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
  await assertAdminUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.verdictFeedback.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/feedback");
}
