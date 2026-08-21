import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { SlopPrintView } from "@/components/slop-print-view";
import {
  sanitizeSlopFindings,
  type SlopFinding,
} from "@/lib/slop-schema";
import type { Sentence } from "@/lib/schema";
import { readAnalysisBlocks } from "@/lib/analysis-document";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Jiddu slop check — print view",
  robots: { index: false, follow: false },
};

export default async function SlopPrintPage({ params }: Props) {
  const { id } = await params;
  const s = await prisma.slopCheck.findUnique({ where: { id } });
  if (!s) notFound();

  const sentences = JSON.parse(s.sentences) as Sentence[];
  const blocks = readAnalysisBlocks(s.blocks, s.text);
  const findings = sanitizeSlopFindings(
    JSON.parse(s.findings) as SlopFinding[],
  );

  return (
    <SlopPrintView
      id={s.id}
      title={s.title}
      sourceRef={s.sourceRef}
      source={s.source}
      text={s.text}
      blocks={blocks}
      sentences={sentences}
      findings={findings}
      score={s.score}
      summary={s.summary ?? ""}
      model={s.model}
      createdAt={s.createdAt}
      reviewedAt={s.reviewedAt}
    />
  );
}
