import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AnalysisView } from "@/components/analysis-view";
import type { Finding, Sentence } from "@/lib/schema";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export default async function AnalysisPage({ params }: Props) {
  const { id } = await params;
  const a = await prisma.analysis.findUnique({ where: { id } });
  if (!a) notFound();

  const sentences = JSON.parse(a.sentences) as Sentence[];
  const findings = JSON.parse(a.findings) as Finding[];

  return (
    <main className="flex-1 flex flex-col">
      <header className="border-b border-rule">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-4 min-w-0">
            <Link href="/" className="font-serif text-2xl tracking-tight shrink-0">
              Jiddu
            </Link>
            <span className="font-serif italic text-muted text-sm hidden md:inline">
              truth is a pathless land
            </span>
          </div>
          <Link
            href="/"
            className="text-sm px-3 py-1.5 rounded-md border border-rule hover:border-foreground transition-colors"
          >
            New analysis
          </Link>
        </div>
      </header>

      <AnalysisView
        title={a.title}
        sourceRef={a.sourceRef}
        source={a.source}
        text={a.text}
        sentences={sentences}
        findings={findings}
        score={a.score}
        summary={a.summary ?? ""}
        provider={a.provider}
        model={a.model}
      />
    </main>
  );
}
