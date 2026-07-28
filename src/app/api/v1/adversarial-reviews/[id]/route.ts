import type { NextRequest } from "next/server";
import { requireApiKey } from "@/lib/api/auth";
import { jsonError } from "@/lib/api/http";
import { prisma } from "@/lib/db";
import {
  findPaperReviewJob,
  mapPaperReviewJob,
} from "@/lib/api/paper-review";
import { consume, rateLimitResponse } from "@/lib/rate-limit";
import { bucketFor, loadSettings } from "@/lib/settings";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiKey(req);
  if (auth instanceof Response) return auth;

  const settings = await loadSettings();
  const rl = consume(
    `v1:adversarial-review-status:${auth.id}`,
    bucketFor(settings, "rate.api", auth),
  );
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{6,30}$/.test(id)) {
    return jsonError("Review job not found.", 404, "not_found");
  }

  // Check ownership before findPaperReviewJob(), which may perform stale-job
  // maintenance. A caller must not be able to mutate another account's job by
  // guessing its public id.
  const ownedJob = await prisma.paperReview.findFirst({
    where: { id, ownerWorkosUserId: auth.userId },
    select: { id: true },
  });
  if (!ownedJob) {
    return jsonError("Review job not found.", 404, "not_found");
  }

  const row = await findPaperReviewJob(id);
  if (!row) {
    return jsonError("Review job not found.", 404, "not_found");
  }

  const response = mapPaperReviewJob(row, new URL(req.url).origin);
  return Response.json(
    row.status === "running"
      ? { ...response, retry_after_seconds: 10 }
      : response,
    {
      headers:
        row.status === "running"
          ? { "cache-control": "no-store", "retry-after": "10" }
          : { "cache-control": "private, no-store" },
    },
  );
}
