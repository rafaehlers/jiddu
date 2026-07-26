import { prisma } from "@/lib/db";
import {
  paperReviewFilename,
  paperReviewToMarkdown,
} from "@/lib/paper-review-markdown";
import { PaperReviewResultSchema } from "@/lib/paper-review-schema";
import { parseStoredVenueProfile } from "@/lib/venues";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const row = await prisma.paperReview.findUnique({ where: { id } });
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  if (!row.review) {
    return Response.json(
      { error: "Review is not complete" },
      { status: 409 },
    );
  }

  const review = PaperReviewResultSchema.parse(JSON.parse(row.review));
  const markdown =
    row.markdown ??
    paperReviewToMarkdown(review, parseStoredVenueProfile(row.venueProfile));
  const filename = paperReviewFilename(review);

  return new Response(markdown, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename="paper-review.md"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "cache-control": "private, no-store",
    },
  });
}
