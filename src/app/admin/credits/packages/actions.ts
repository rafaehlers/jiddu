"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

const PACKAGES_PATH = "/admin/credits/packages";

export async function createCreditPackageAction(
  formData: FormData,
): Promise<void> {
  await assertAdminUser();
  const parsed = parsePackage(formData);
  if (!parsed) redirect(`${PACKAGES_PATH}?error=invalid`);

  await prisma.jidduCreditPackage.create({ data: parsed });
  revalidatePath(PACKAGES_PATH);
  redirect(`${PACKAGES_PATH}?created=1`);
}

export async function updateCreditPackageAction(
  formData: FormData,
): Promise<void> {
  await assertAdminUser();
  const id = String(formData.get("id") ?? "");
  const parsed = parsePackage(formData);
  if (!id || !parsed) redirect(`${PACKAGES_PATH}?error=invalid`);

  const updated = await prisma.jidduCreditPackage.updateMany({
    where: { id },
    data: parsed,
  });
  if (updated.count !== 1) redirect(`${PACKAGES_PATH}?error=not_found`);
  revalidatePath(PACKAGES_PATH);
  redirect(`${PACKAGES_PATH}?updated=1`);
}

export async function deleteCreditPackageAction(
  formData: FormData,
): Promise<void> {
  await assertAdminUser();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect(`${PACKAGES_PATH}?error=invalid`);

  const deleted = await prisma.jidduCreditPackage.deleteMany({ where: { id } });
  if (deleted.count !== 1) redirect(`${PACKAGES_PATH}?error=not_found`);
  revalidatePath(PACKAGES_PATH);
  redirect(`${PACKAGES_PATH}?deleted=1`);
}

function parsePackage(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim().slice(0, 100);
  const description =
    String(formData.get("description") ?? "").trim().slice(0, 500) || null;
  const credits = Number(String(formData.get("credits") ?? ""));
  const sortOrder = Number(String(formData.get("sortOrder") ?? "0"));
  const priceCents = parseUsdToCents(
    String(formData.get("priceUsd") ?? "").trim(),
  );

  if (
    name.length < 2 ||
    !Number.isSafeInteger(credits) ||
    credits < 1 ||
    credits > 100_000_000 ||
    !Number.isSafeInteger(sortOrder) ||
    Math.abs(sortOrder) > 1_000_000 ||
    priceCents === null ||
    priceCents < 1 ||
    priceCents > 100_000_000
  ) {
    return null;
  }

  return {
    name,
    description,
    credits,
    priceCents,
    active: formData.get("active") === "on",
    sortOrder,
  };
}

function parseUsdToCents(value: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  const cents =
    Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
  return Number.isSafeInteger(cents) ? cents : null;
}
