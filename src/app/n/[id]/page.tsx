import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SkeletonReveal } from "@/components/skeleton-reveal";
import { AnalysisSkeleton } from "@/components/analysis-skeleton";
import { ScrollIndicator } from "@/components/scroll-indicator";
import { NeutralityView } from "@/components/neutrality-view";
import type { Sentence } from "@/lib/schema";
import type {
  NeutralityFinding,
  NeutralityVerdictValue,
  TextType,
} from "@/lib/neutrality-schema";
import { analysisSocialMetadata } from "@/lib/social-metadata";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const n = await prisma.neutrality.findUnique({ where: { id } });
  if (!n) return { title: "Jiddu" };
  const title = n.title ?? "Untitled";
  const desc = `${n.verdict.replace(/_/g, " ")} (${Math.round(n.confidence * 100)}% confidence). Assessed with Jiddu.`;
  return analysisSocialMetadata({
    title: `${title} · Jiddu neutrality`,
    description: desc,
    path: `/n/${id}`,
  });
}

export default async function NeutralityViewerPage({ params }: Props) {
  const { id } = await params;
  const n = await prisma.neutrality.findUnique({ where: { id } });
  if (!n) notFound();

  const sentences = JSON.parse(n.sentences) as Sentence[];
  const findings = JSON.parse(n.findings) as NeutralityFinding[];

  return (
    <main className="flex-1 flex flex-col">
      <SiteHeader variant="viewer" />

      <SkeletonReveal skeleton={<AnalysisSkeleton />}>
        <NeutralityView
          id={n.id}
          title={n.title}
          sourceRef={n.sourceRef}
          source={n.source}
          text={n.text}
          sentences={sentences}
          findings={findings}
          verdict={n.verdict as NeutralityVerdictValue}
          confidence={n.confidence}
          rationale={n.rationale ?? ""}
          textType={(n.textType ?? "informational") as TextType}
          status={n.status}
          model={n.model}
        />
      </SkeletonReveal>

      <SiteFooter />
      <ScrollIndicator />
    </main>
  );
}
