import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AnalysisView } from "@/components/analysis-view";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AnalysisHeaderActions } from "@/components/analysis-header-actions";
import { ScrollIndicator } from "@/components/scroll-indicator";
import { UnreviewedBanner } from "@/components/unreviewed-banner";
import type { Finding, Sentence } from "@/lib/schema";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const a = await prisma.analysis.findUnique({ where: { id } });
  if (!a) return { title: "Jiddu" };
  const title = a.title ?? "Untitled";
  const score = a.score ?? 0;
  const label =
    score >= 81
      ? "Propagandistic"
      : score >= 61
        ? "Highly fallacious"
        : score >= 36
          ? "Several fallacies"
          : score >= 16
            ? "Minor issues"
            : "Clean reasoning";
  const desc = `${score}/100 — ${label}. Analyzed with Jiddu.`;
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

export default async function AnalysisPage({ params }: Props) {
  const { id } = await params;
  const a = await prisma.analysis.findUnique({ where: { id } });
  if (!a) notFound();

  const sentences = JSON.parse(a.sentences) as Sentence[];
  const findings = JSON.parse(a.findings) as Finding[];

  return (
    <main className="flex-1 flex flex-col">
      <SiteHeader
        variant="viewer"
        rightSlot={<AnalysisHeaderActions />}
      />

      {a.reviewedAt === null && <UnreviewedBanner />}

      <AnalysisView
        id={a.id}
        title={a.title}
        sourceRef={a.sourceRef}
        source={a.source}
        text={a.text}
        sentences={sentences}
        findings={findings}
        score={a.status === "complete" ? a.score : null}
        summary={a.summary ?? ""}
        provider={a.provider}
        model={a.model}
      />

      <SiteFooter />
      <ScrollIndicator />
    </main>
  );
}
