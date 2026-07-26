import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PaperReviewResultSchema } from "@/lib/paper-review-schema";
import { PaperReviewPrintView } from "@/components/paper-review-print-view";
import { parseStoredVenueProfile } from "@/lib/venues";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export default async function PaperReviewPrintPage({ params }: Props) {
  const { id } = await params;
  const row = await prisma.paperReview.findUnique({ where: { id } });
  if (!row?.review) notFound();
  const review = PaperReviewResultSchema.parse(JSON.parse(row.review));
  return (
    <PaperReviewPrintView
      review={review}
      model={row.model}
      id={row.id}
      venueProfile={parseStoredVenueProfile(row.venueProfile)}
    />
  );
}
