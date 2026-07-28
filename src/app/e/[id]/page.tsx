import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SkeletonReveal } from "@/components/skeleton-reveal";
import { AnalysisSkeleton } from "@/components/analysis-skeleton";
import { ScrollIndicator } from "@/components/scroll-indicator";
import { ExplainView } from "@/components/explain-view";
import type { Block } from "@/lib/paragraphs";
import type { ExplainFinding, ExplainLevel } from "@/lib/explain-schema";
import { analysisSocialMetadata } from "@/lib/social-metadata";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const e = await prisma.explanation.findUnique({ where: { id } });
  if (!e) return { title: "Jiddu" };
  const title = e.title ?? "Untitled";
  const desc = e.overview
    ? e.overview.slice(0, 200)
    : "Explained paragraph by paragraph with Jiddu.";
  return analysisSocialMetadata({
    title: `${title} · Jiddu explainer`,
    description: desc,
    path: `/e/${id}`,
  });
}

export default async function ExplainViewerPage({ params }: Props) {
  const { id } = await params;
  const e = await prisma.explanation.findUnique({ where: { id } });
  if (!e) notFound();

  const blocks = JSON.parse(e.blocks) as Block[];
  const findings = JSON.parse(e.findings) as ExplainFinding[];

  return (
    <main className="flex-1 flex flex-col">
      <SiteHeader variant="viewer" />

      <SkeletonReveal skeleton={<AnalysisSkeleton />}>
        <ExplainView
          id={e.id}
          title={e.title}
          sourceRef={e.sourceRef}
          source={e.source}
          blocks={blocks}
          findings={findings}
          overview={e.overview ?? ""}
          level={(e.level ?? "undergrad") as ExplainLevel}
          status={e.status}
          model={e.model}
        />
      </SkeletonReveal>

      <SiteFooter />
      <ScrollIndicator />
    </main>
  );
}
