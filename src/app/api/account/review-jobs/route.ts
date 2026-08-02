import { withAuth } from "@workos-inc/authkit-nextjs";
import {
  listPaperReviewJobs,
  mapPaperReviewJobStatus,
} from "@/lib/api/paper-review";

export const runtime = "nodejs";

export async function GET() {
  const { user } = await withAuth();
  if (!user) {
    return Response.json(
      { error: "Sign in to view review jobs." },
      { status: 401 },
    );
  }

  const rows = await listPaperReviewJobs(user.id);
  return Response.json(
    { jobs: rows.map((row) => mapPaperReviewJobStatus(row)) },
    { headers: { "cache-control": "private, no-store" } },
  );
}
