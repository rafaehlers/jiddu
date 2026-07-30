import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAnalysisTitle } from "@/lib/live-title";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await prisma.analysis.findUnique({ where: { id } });
  if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: a.id,
    source: a.source,
    sourceRef: a.sourceRef,
    title: resolveAnalysisTitle({
      title: a.title,
      source: a.source,
      createdAt: a.createdAt,
      summary: a.summary,
      transcript: a.transcript ?? a.text,
      language: a.language,
    }),
    text: a.text,
    language: a.language,
    provider: a.provider,
    model: a.model,
    score: a.score,
    summary: a.summary,
    sentences: JSON.parse(a.sentences),
    findings: JSON.parse(a.findings),
    createdAt: a.createdAt.toISOString(),
  });
}
