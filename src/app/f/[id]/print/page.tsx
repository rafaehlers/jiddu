import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { FactCheckPrintView } from "@/components/factcheck-print-view";
import type { Sentence } from "@/lib/schema";
import type { Claim } from "@/lib/claims-schema";
import type { Verdict } from "@/lib/verdict-schema";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Jiddu fact-check — print view",
  robots: { index: false, follow: false },
};

export default async function FactCheckPrintPage({ params }: Props) {
  const { id } = await params;
  const f = await prisma.factCheck.findUnique({ where: { id } });
  if (!f) notFound();

  const sentences = JSON.parse(f.sentences) as Sentence[];
  const claims = JSON.parse(f.claims) as (Claim & { id: string })[];
  const verdicts = JSON.parse(f.verdicts) as Verdict[];

  return (
    <FactCheckPrintView
      id={f.id}
      title={f.title}
      sourceRef={f.sourceRef}
      source={f.source}
      text={f.text}
      sentences={sentences}
      claims={claims}
      verdicts={verdicts}
      verifyModel={f.verifyModel}
      model={f.model}
      createdAt={f.createdAt}
      reviewedAt={f.reviewedAt}
    />
  );
}
