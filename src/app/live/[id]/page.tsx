import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { readLiveContext } from "@/lib/live-context-schema";
import { resolveAnalysisTitle } from "@/lib/live-title";
import { analysisSocialMetadata } from "@/lib/social-metadata";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LiveContextRecapView } from "@/components/live/context-recap-view";
import { canEmailOwnedReport } from "@/lib/report-email-access";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const analysis = await prisma.analysis.findUnique({ where: { id } });
  if (!analysis || analysis.source !== "live") return { title: "Jiddu Live" };
  const title = liveTitle(analysis);
  return analysisSocialMetadata({
    title: `${title} · Jiddu Live`,
    description:
      "Tags, topics, glossary, related sources and recap from a Jiddu Live session.",
    path: `/live/${id}`,
  });
}

export default async function LiveContextRecapPage({ params }: Props) {
  const { id } = await params;
  const analysis = await prisma.analysis.findUnique({ where: { id } });
  if (!analysis || analysis.source !== "live" || !analysis.liveContext) {
    notFound();
  }
  const canEmail = await canEmailOwnedReport(analysis.ownerWorkosUserId);

  return (
    <main className="flex min-h-screen flex-1 flex-col">
      <SiteHeader variant="viewer" />
      <LiveContextRecapView
        canEmail={canEmail}
        id={analysis.id}
        title={liveTitle(analysis)}
        transcript={analysis.transcript ?? analysis.text}
        context={readLiveContext(analysis.liveContext)}
        audioDurationMs={analysis.audioDurationMs}
      />
      <SiteFooter />
    </main>
  );
}

function liveTitle(analysis: {
  title: string | null;
  source: string;
  createdAt: Date;
  summary: string | null;
  transcript: string | null;
  text: string;
  language: string | null;
}): string {
  return (
    resolveAnalysisTitle({
      title: analysis.title,
      source: analysis.source,
      createdAt: analysis.createdAt,
      summary: analysis.summary,
      transcript: analysis.transcript ?? analysis.text,
      language: analysis.language,
    }) ?? "Jiddu Live"
  );
}
