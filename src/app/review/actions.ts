"use server";

import { headers } from "next/headers";
import type { EmailFormState } from "@/lib/email-form-state";
import { consume } from "@/lib/rate-limit";
import { sendVenueSuggestionEmail } from "@/lib/support-email";
import { venueSuggestionSchema } from "@/lib/venue-suggestion";

export async function sendVenueSuggestionAction(
  _previousState: EmailFormState,
  formData: FormData,
): Promise<EmailFormState> {
  // Honeypot: silently accept bot submissions without sending an email.
  if (String(formData.get("company") ?? "")) {
    return { status: "success" };
  }

  const parsed = venueSuggestionSchema.safeParse({
    lang: formData.get("lang"),
    name: formData.get("name"),
    url: formData.get("url"),
  });
  if (!parsed.success) return { status: "error", code: "validation" };

  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const identifier = forwarded || requestHeaders.get("x-real-ip") || "anon";
  const limit = consume(`venue-suggestion:${identifier}`, {
    capacity: 3,
    refillPerSec: 3 / 3600,
  });
  if (!limit.allowed) return { status: "error", code: "rate_limit" };

  try {
    await sendVenueSuggestionEmail(parsed.data);
    return { status: "success" };
  } catch (error) {
    console.error("Could not send venue suggestion email:", error);
    return { status: "error", code: "send_failed" };
  }
}
