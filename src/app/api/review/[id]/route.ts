import { withAuth } from "@workos-inc/authkit-nextjs";
import {
  findPaperReviewJob,
  mapPaperReviewJobStatus,
} from "@/lib/api/paper-review";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user } = await withAuth();
  if (!user) {
    return Response.json(
      { error: "Sign in to check this review job." },
      { status: 401 },
    );
  }

  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{6,30}$/.test(id)) {
    return Response.json({ error: "Review job not found." }, { status: 404 });
  }

  const row = await findPaperReviewJob(id, user.id);
  if (!row) {
    return Response.json({ error: "Review job not found." }, { status: 404 });
  }

  return Response.json(mapPaperReviewJobStatus(row), {
    headers: {
      "cache-control": "private, no-store",
      ...(row.status === "running" ? { "retry-after": "10" } : {}),
    },
  });
}
