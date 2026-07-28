import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PaperReviewResultSchema } from "@/lib/paper-review-schema";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PaperReviewView } from "@/components/paper-review-view";
import { ScrollIndicator } from "@/components/scroll-indicator";
import { parseStoredVenueProfile } from "@/lib/venues";
import { analysisSocialMetadata } from "@/lib/social-metadata";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const row = await prisma.paperReview.findUnique({ where: { id } });
  if (!row) return { title: "Jiddu" };
  return analysisSocialMetadata({
    title: `${row.title ?? "Paper"} · adversarial review`,
    description:
      "AI-generated adversarial pre-submission review. Validate with a human domain expert.",
    path: `/r/${id}`,
  });
}

export default async function PaperReviewPage({ params }: Props) {
  const { id } = await params;
  const row = await prisma.paperReview.findUnique({ where: { id } });
  if (!row) notFound();

  if (!row.review) {
    return (
      <main className="flex-1 flex flex-col">
        <SiteHeader variant="viewer" />
        <section className="mx-auto max-w-3xl w-full px-6 py-16 flex flex-col gap-4">
          <h1 className="font-serif text-3xl">
            {row.title ?? "Adversarial paper review"}
          </h1>
          <p className="text-muted">
            Status: {row.status} · stage: {row.stage}
          </p>
          {row.errorMessage && (
            <p className="text-[var(--severity-high)]">{row.errorMessage}</p>
          )}
        </section>
        <SiteFooter />
      </main>
    );
  }

  const parsed = PaperReviewResultSchema.safeParse(JSON.parse(row.review));
  if (!parsed.success) notFound();

  return (
    <main className="flex-1 flex flex-col">
      <SiteHeader variant="viewer" />
      <PaperReviewView
        id={row.id}
        review={parsed.data}
        model={row.model}
        parser={row.parser}
        status={row.status}
        venueProfile={parseStoredVenueProfile(row.venueProfile)}
      />
      <SiteFooter />
      <ScrollIndicator />
    </main>
  );
}
