import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AnalysisPrintView } from "@/components/analysis-print-view";
import { resolveAnalysisTitle } from "@/lib/live-title";
import { readAnalysisBlocks } from "@/lib/analysis-document";
import type { Finding, Sentence } from "@/lib/schema";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Jiddu analysis — print view",
  robots: { index: false, follow: false },
};

export default async function AnalysisPrintPage({ params }: Props) {
  const { id } = await params;
  const a = await prisma.analysis.findUnique({ where: { id } });
  if (!a) notFound();

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
    <AnalysisPrintView
      id={a.id}
      title={title}
      sourceRef={a.sourceRef}
      source={a.source}
      text={a.text}
      blocks={blocks}
      sentences={sentences}
      findings={findings}
      score={a.score}
      summary={a.summary ?? ""}
      model={a.model}
      createdAt={a.createdAt}
      reviewedAt={a.reviewedAt}
    />
  );
}
