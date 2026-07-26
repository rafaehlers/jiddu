import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { SlopView } from "@/components/slop-view";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ScrollIndicator } from "@/components/scroll-indicator";
import { SkeletonReveal } from "@/components/skeleton-reveal";
import { AnalysisSkeleton } from "@/components/analysis-skeleton";
import type { SlopFinding } from "@/lib/slop-schema";
import type { Sentence } from "@/lib/schema";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const s = await prisma.slopCheck.findUnique({ where: { id } });
  if (!s) return { title: "Jiddu" };
  const title = s.title ?? "Untitled";
  const score = s.score ?? 0;
  const label =
    score >= 81
      ? "Assembly-line prose"
      : score >= 61
        ? "Heavily templated"
        : score >= 36
          ? "Patterned"
          : score >= 16
            ? "Light seasoning"
            : "Reads human";
  const desc = `${score}/100 — ${label}. Checked for AI-slop patterns with Jiddu.`;
  return {
    title: `${title} · Jiddu`,
    description: desc,
    openGraph: {
      title: `${title} · Jiddu`,
      description: desc,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · Jiddu`,
      description: desc,
    },
  };
}

export default async function SlopPage({ params }: Props) {
  const { id } = await params;
  const s = await prisma.slopCheck.findUnique({ where: { id } });
  if (!s) notFound();

  const sentences = JSON.parse(s.sentences) as Sentence[];
  const findings = JSON.parse(s.findings) as SlopFinding[];

  return (
    <main className="flex-1 flex flex-col">
      <SiteHeader variant="viewer" />

      <SkeletonReveal skeleton={<AnalysisSkeleton />}>
        <SlopView
          id={s.id}
          title={s.title}
          sourceRef={s.sourceRef}
          source={s.source}
          text={s.text}
          sentences={sentences}
          findings={findings}
          score={s.status === "complete" ? s.score : null}
          summary={s.summary ?? ""}
          provider={s.provider}
          model={s.model}
        />
      </SkeletonReveal>

      <SiteFooter />
      <ScrollIndicator />
    </main>
  );
}
