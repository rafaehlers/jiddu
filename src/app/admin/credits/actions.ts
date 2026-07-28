"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdminUser } from "@/lib/admin-auth";
import { adjustJidduCredits } from "@/lib/jiddu-credits";
import { findWorkOSUserByEmail } from "@/lib/workos-users";

export async function adjustCreditsAction(formData: FormData): Promise<void> {
  const admin = await assertAdminUser();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const amount = Number(String(formData.get("amount") ?? ""));
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !Number.isSafeInteger(amount) ||
    amount === 0 ||
    Math.abs(amount) > 1_000_000
  ) {
    redirect("/admin/credits?error=invalid_adjustment");
  }

  const user = await findWorkOSUserByEmail(email);
  if (!user) redirect("/admin/credits?error=user_not_found");

  try {
    await adjustJidduCredits({
      workosUserId: user.id,
      email: user.email,
      amount,
      actorWorkosUserId: admin.id,
      note,
    });
  } catch {
    redirect("/admin/credits?error=insufficient_balance");
  }

  revalidatePath("/admin/credits");
  revalidatePath("/account");
  redirect("/admin/credits?adjusted=1");
}
