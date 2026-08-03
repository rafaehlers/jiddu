"use server";

import { headers } from "next/headers";
import { z } from "zod";
import type { EmailFormState } from "@/lib/email-form-state";
import { consume } from "@/lib/rate-limit";
import { sendPublicContactEmails } from "@/lib/support-email";

const contactSchema = z.object({
  email: z.string().trim().email().max(320),
  lang: z.enum(["en", "pt", "es"]),
  message: z.string().trim().min(10).max(5000),
  name: z.string().trim().min(2).max(100),
  subject: z.string().trim().min(3).max(160),
});

export async function sendPublicContactAction(
  _previousState: EmailFormState,
  formData: FormData,
): Promise<EmailFormState> {
  // Honeypot: report success so automated submitters do not learn that the
  // field blocked delivery, while sending nothing through Resend.
  if (String(formData.get("company") ?? "")) {
    return { status: "success" };
  }

  const parsed = contactSchema.safeParse({
    email: formData.get("email"),
    lang: formData.get("lang"),
    message: formData.get("message"),
    name: formData.get("name"),
    subject: formData.get("subject"),
  });
  if (!parsed.success) return { status: "error", code: "validation" };

  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const identifier = forwarded || requestHeaders.get("x-real-ip") || "anon";
  const limit = consume(`public-contact:${identifier}`, {
    capacity: 3,
    refillPerSec: 3 / 3600,
  });
  if (!limit.allowed) return { status: "error", code: "rate_limit" };

  try {
    await sendPublicContactEmails(parsed.data);
    return { status: "success" };
  } catch (error) {
    console.error("Could not send public contact email:", error);
    return { status: "error", code: "send_failed" };
  }
}
