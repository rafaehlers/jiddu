import { notFound } from "next/navigation";
import { LiveContextPrintView } from "@/components/live/context-print-view";
import { prisma } from "@/lib/db";
import { readLiveContext } from "@/lib/live-context-schema";
import { resolveAnalysisTitle } from "@/lib/live-title";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Jiddu Live — print view",
  robots: { index: false, follow: false },
};

export default async function LiveContextPrintPage({ params }: Props) {
  const { id } = await params;
  const analysis = await prisma.analysis.findUnique({ where: { id } });
  if (!analysis || analysis.source !== "live" || !analysis.liveContext) {
    notFound();
  }
  const title =
    resolveAnalysisTitle({
      title: analysis.title,
      source: analysis.source,
      createdAt: analysis.createdAt,
      summary: analysis.summary,
      transcript: analysis.transcript ?? analysis.text,
      language: analysis.language,
    }) ?? "Jiddu Live";

  return (
    <LiveContextPrintView
      id={analysis.id}
      title={title}
      transcript={analysis.transcript ?? analysis.text}
      context={readLiveContext(analysis.liveContext)}
      model={analysis.model}
      createdAt={analysis.createdAt}
      audioDurationMs={analysis.audioDurationMs}
    />
  );
}
