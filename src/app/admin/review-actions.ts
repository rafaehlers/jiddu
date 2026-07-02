"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ADMIN_COOKIE_NAME, adminTokenIsValid } from "./auth";

async function assertAdmin(): Promise<void> {
  const jar = await cookies();
  if (!adminTokenIsValid(jar.get(ADMIN_COOKIE_NAME)?.value)) {
    throw new Error("Forbidden");
  }
}

// Toggle reviewedAt on any analysis kind. The form passes the kind
// ("fallacy" | "factcheck" | "neutrality" | "explain") + row id; we flip
// null<->now and revalidate the admin list.
export async function toggleReviewedAction(formData: FormData): Promise<void> {
  await assertAdmin();
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
  }
  revalidatePath("/admin");
}
