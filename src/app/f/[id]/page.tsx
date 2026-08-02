import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SkeletonReveal } from "@/components/skeleton-reveal";
import { AnalysisSkeleton } from "@/components/analysis-skeleton";
import { ScrollIndicator } from "@/components/scroll-indicator";
import { FactCheckView } from "@/components/factcheck-view";
import type { Sentence } from "@/lib/schema";
import type { Claim } from "@/lib/claims-schema";
import type { Verdict } from "@/lib/verdict-schema";
import { loadSettings } from "@/lib/settings";
import { analysisSocialMetadata } from "@/lib/social-metadata";
import { readAnalysisBlocks } from "@/lib/analysis-document";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const f = await prisma.factCheck.findUnique({ where: { id } });
  if (!f) return { title: "Jiddu" };
  const title = f.title ?? "Untitled";
  const claims = JSON.parse(f.claims) as (Claim & { id: string })[];
  const desc = `${claims.length} verifiable claim${claims.length === 1 ? "" : "s"} extracted. Reviewed with Jiddu fact-check.`;
  return analysisSocialMetadata({
    title: `${title} · Jiddu fact-check`,
    description: desc,
    path: `/f/${id}`,
  });
}

export default async function FactCheckPageView({ params }: Props) {
  const { id } = await params;
  const f = await prisma.factCheck.findUnique({ where: { id } });
  if (!f) notFound();

  const sentences = JSON.parse(f.sentences) as Sentence[];
  const blocks = readAnalysisBlocks(f.blocks, f.text);
  const claims = JSON.parse(f.claims) as (Claim & { id: string })[];
  const verdicts = JSON.parse(f.verdicts) as Verdict[];
  const refreshCounts = parseCounts(f.refreshCounts);
  const settings = await loadSettings();
  const maxRefreshPerClaim = Math.max(
    1,
    Math.floor(settings["factcheck.maxRefreshPerClaim"]),
  );

  return (
    <main className="flex-1 flex flex-col">
      <SiteHeader variant="viewer" />

      <SkeletonReveal skeleton={<AnalysisSkeleton />}>
        <FactCheckView
          id={f.id}
          title={f.title}
          sourceRef={f.sourceRef}
          source={f.source}
          text={f.text}
          blocks={blocks}
          sentences={sentences}
          claims={claims}
          status={f.status}
          provider={f.provider}
          model={f.model}
          initialVerdicts={verdicts}
          initialVerifyStatus={f.verifyStatus}
          verifyModel={f.verifyModel}
          initialRefreshCounts={refreshCounts}
          maxRefreshPerClaim={maxRefreshPerClaim}
        />
      </SkeletonReveal>

      <SiteFooter />
      <ScrollIndicator />
    </main>
  );
}

function parseCounts(raw: string): Record<string, number> {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const out: Record<string, number> = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
      }
      return out;
    }
  } catch {
    // ignore
  }
  return {};
}
