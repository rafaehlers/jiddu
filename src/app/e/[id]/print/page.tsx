import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ExplainPrintView } from "@/components/explain-print-view";
import type { Block } from "@/lib/paragraphs";
import type { ExplainFinding, ExplainLevel } from "@/lib/explain-schema";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Jiddu explainer — print view",
  robots: { index: false, follow: false },
};

export default async function ExplainPrintPage({ params }: Props) {
  const { id } = await params;
  const e = await prisma.explanation.findUnique({ where: { id } });
  if (!e) notFound();

  const blocks = JSON.parse(e.blocks) as Block[];
  const findings = JSON.parse(e.findings) as ExplainFinding[];

  return (
    <ExplainPrintView
      id={e.id}
      title={e.title}
      sourceRef={e.sourceRef}
      source={e.source}
      text={e.text}
      blocks={blocks}
      findings={findings}
      overview={e.overview ?? ""}
      level={(e.level ?? "undergrad") as ExplainLevel}
      model={e.model}
      createdAt={e.createdAt}
      reviewedAt={e.reviewedAt}
    />
  );
}
