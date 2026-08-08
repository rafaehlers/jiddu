import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AnalysisView } from "@/components/analysis-view";
import { ResultPageCta } from "@/components/result-page-cta";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ScrollIndicator } from "@/components/scroll-indicator";
import { SkeletonReveal } from "@/components/skeleton-reveal";
import { AnalysisSkeleton } from "@/components/analysis-skeleton";
import { analysisSocialMetadata } from "@/lib/social-metadata";
import { resolveAnalysisTitle } from "@/lib/live-title";
import { readAnalysisBlocks } from "@/lib/analysis-document";
import { canEmailOwnedReport } from "@/lib/report-email-access";
import type { Finding, Sentence } from "@/lib/schema";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const a = await prisma.analysis.findUnique({ where: { id } });
  if (!a) return { title: "Jiddu" };
  const title =
    resolveAnalysisTitle({
      title: a.title,
      source: a.source,
      createdAt: a.createdAt,
      summary: a.summary,
      transcript: a.transcript ?? a.text,
      language: a.language,
    }) ?? "Untitled";
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
  return analysisSocialMetadata({
    title: `${title} · Jiddu`,
    description: desc,
    path: `/a/${id}`,
  });
}

export default async function AnalysisPage({ params }: Props) {
  const { id } = await params;
  const a = await prisma.analysis.findUnique({ where: { id } });
  if (!a) notFound();
  const canEmail = await canEmailOwnedReport(a.ownerWorkosUserId);

  const sentences = JSON.parse(a.sentences) as Sentence[];
  const blocks = readAnalysisBlocks(a.blocks, a.text);
  const findings = JSON.parse(a.findings) as Finding[];
  const title = resolveAnalysisTitle({
    title: a.title,
    source: a.source,
    createdAt: a.createdAt,
    summary: a.summary,
    transcript: a.transcript ?? a.text,
    language: a.language,
  });

  return (
    <main className="flex-1 flex flex-col">
      <SiteHeader variant="viewer" />

      <SkeletonReveal skeleton={<AnalysisSkeleton />}>
        <AnalysisView
          canEmail={canEmail}
          id={a.id}
          title={title}
          sourceRef={a.sourceRef}
          source={a.source}
          text={a.text}
          blocks={blocks}
          sentences={sentences}
          findings={findings}
          score={a.status === "complete" ? a.score : null}
          summary={a.summary ?? ""}
          provider={a.provider}
          model={a.model}
        />
      </SkeletonReveal>

      <ResultPageCta href="/" />
      <SiteFooter />
      <ScrollIndicator />
    </main>
  );
}
