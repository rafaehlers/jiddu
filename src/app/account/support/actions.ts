"use server";

import { withAuth } from "@workos-inc/authkit-nextjs";
import { z } from "zod";
import type { EmailFormState } from "@/lib/email-form-state";
import { consume } from "@/lib/rate-limit";
import { sendAccountSupportEmail } from "@/lib/support-email";

const supportSchema = z.object({
  message: z.string().trim().min(10).max(5000),
  subject: z.string().trim().min(3).max(160),
});

export async function sendAccountSupportAction(
  _previousState: EmailFormState,
  formData: FormData,
): Promise<EmailFormState> {
  const { user } = await withAuth();
  if (!user) return { status: "error", code: "auth_required" };
  if (!user.emailVerified) {
    return { status: "error", code: "email_unverified" };
  }

  const parsed = supportSchema.safeParse({
    message: formData.get("message"),
    subject: formData.get("subject"),
  });
  if (!parsed.success) return { status: "error", code: "validation" };

  const limit = consume(`account-support:${user.id}`, {
    capacity: 5,
    refillPerSec: 5 / 3600,
  });
  if (!limit.allowed) return { status: "error", code: "rate_limit" };

  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.email;
  try {
    await sendAccountSupportEmail({
      ...parsed.data,
      email: user.email,
      name,
    });
    return { status: "success" };
  } catch (error) {
    console.error("Could not send account support email:", error);
    return { status: "error", code: "send_failed" };
  }
}
