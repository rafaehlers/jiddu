import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { NeutralityPrintView } from "@/components/neutrality-print-view";
import type { Sentence } from "@/lib/schema";
import type {
  NeutralityFinding,
  NeutralityVerdictValue,
  TextType,
} from "@/lib/neutrality-schema";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Jiddu neutrality — print view",
  robots: { index: false, follow: false },
};

export default async function NeutralityPrintPage({ params }: Props) {
  const { id } = await params;
  const n = await prisma.neutrality.findUnique({ where: { id } });
  if (!n) notFound();

  const sentences = JSON.parse(n.sentences) as Sentence[];
  const findings = JSON.parse(n.findings) as NeutralityFinding[];

  return (
    <NeutralityPrintView
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
      model={n.model}
      createdAt={n.createdAt}
      reviewedAt={n.reviewedAt}
    />
  );
}
