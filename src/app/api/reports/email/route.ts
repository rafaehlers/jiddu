import { withAuth } from "@workos-inc/authkit-nextjs";
import { NextRequest } from "next/server";
import { z } from "zod";
import { consume } from "@/lib/rate-limit";
import { REPORT_KINDS, sendOwnedReportEmail } from "@/lib/report-email";

export const runtime = "nodejs";
export const maxDuration = 30;

const BodySchema = z.object({
  id: z.string().trim().min(1).max(128),
  kind: z.enum(REPORT_KINDS),
  lang: z.enum(["en", "pt", "es"]),
});

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && safeOrigin(origin) !== request.nextUrl.origin) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }

  const { user } = await withAuth();
  if (!user) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }
  if (!user.emailVerified) {
    return Response.json({ error: "Verified email required" }, { status: 403 });
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid report request" }, { status: 400 });
  }

  const rate = consume(`report-email:${user.id}`, {
    capacity: 8,
    refillPerSec: 8 / 3600,
  });
  if (!rate.allowed) {
    return Response.json(
      { error: "Too many report emails" },
      {
        status: 429,
        headers: { "retry-after": String(rate.retryAfterSec) },
      },
    );
  }

  try {
    const sent = await sendOwnedReportEmail({
      ...parsed.data,
      email: user.email,
      requestUrl: request.url,
      userId: user.id,
    });
    if (!sent) {
      return Response.json({ error: "Report not found" }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Could not email report:", error);
    return Response.json({ error: "Could not email report" }, { status: 500 });
  }
}

function safeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}
