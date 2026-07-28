"use server";

import { revalidatePath } from "next/cache";
import { assertAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

// Toggle reviewedAt on any analysis kind. The form passes the kind
// ("fallacy" | "factcheck" | "neutrality" | "explain" | "slop" | "review") + row id;
// we flip null<->now and revalidate the admin list.
export async function toggleReviewedAction(formData: FormData): Promise<void> {
  await assertAdminUser();
  const kind = String(formData.get("kind") ?? "");
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  if (kind === "fallacy") {
    const row = await prisma.analysis.findUnique({
      where: { id },
      select: { reviewedAt: true },
    });
    if (!row) return;
    await prisma.analysis.update({
      where: { id },
      data: { reviewedAt: row.reviewedAt ? null : new Date() },
    });
  } else if (kind === "factcheck") {
    const row = await prisma.factCheck.findUnique({
      where: { id },
      select: { reviewedAt: true },
    });
    if (!row) return;
    await prisma.factCheck.update({
      where: { id },
      data: { reviewedAt: row.reviewedAt ? null : new Date() },
    });
  } else if (kind === "neutrality") {
    const row = await prisma.neutrality.findUnique({
      where: { id },
      select: { reviewedAt: true },
    });
    if (!row) return;
    await prisma.neutrality.update({
      where: { id },
      data: { reviewedAt: row.reviewedAt ? null : new Date() },
    });
  } else if (kind === "explain") {
    const row = await prisma.explanation.findUnique({
      where: { id },
      select: { reviewedAt: true },
    });
    if (!row) return;
    await prisma.explanation.update({
      where: { id },
      data: { reviewedAt: row.reviewedAt ? null : new Date() },
    });
  } else if (kind === "slop") {
    const row = await prisma.slopCheck.findUnique({
      where: { id },
      select: { reviewedAt: true },
    });
    if (!row) return;
    await prisma.slopCheck.update({
      where: { id },
      data: { reviewedAt: row.reviewedAt ? null : new Date() },
    });
  } else if (kind === "review") {
    const row = await prisma.paperReview.findUnique({
      where: { id },
      select: { reviewedAt: true },
    });
    if (!row) return;
    await prisma.paperReview.update({
      where: { id },
      data: { reviewedAt: row.reviewedAt ? null : new Date() },
    });
  }
  revalidatePath("/admin");
}
