import { withAuth } from "@workos-inc/authkit-nextjs";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ContextReviewWorkspace } from "@/components/context/context-review-workspace";
import {
  getKnowledgeEntityDTO,
  getKnowledgeRelationDTO,
} from "@/lib/context-knowledge";
import { parseContextReplayEvent } from "@/lib/context-replay-schema";
import { prisma } from "@/lib/db";
import { readLiveContext } from "@/lib/live-context-schema";
import { readSavedDiarization } from "@/lib/live/diarization";
import { resolveAnalysisTitle } from "@/lib/live-title";
import type { LiveClaim } from "@/lib/live/use-live-analysis";
import type {
  NeutralityFinding,
  NeutralityVerdictValue,
} from "@/lib/neutrality-schema";
import type { Finding, Sentence } from "@/lib/schema";
import type { Verdict } from "@/lib/verdict-schema";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Saved context workspace · Jiddu",
  robots: { index: false, follow: false },
};

export default async function SavedContextPage({ params }: Props) {
  const { id } = await params;
  const { user } = await withAuth();
  if (!user)
    redirect(`/login?returnTo=${encodeURIComponent(`/context/${id}`)}`);

  const analysis = await prisma.analysis.findFirst({
    where: { id, ownerWorkosUserId: user.id, source: "live" },
    include: {
      knowledgeEntityMentions: true,
      knowledgeRelationMentions: true,
      contextSessionEvents: {
        orderBy: [{ elapsedMs: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!analysis) notFound();

  const [factCheck, neutrality] = await Promise.all([
    prisma.factCheck.findFirst({ where: { id, ownerWorkosUserId: user.id } }),
    prisma.neutrality.findFirst({ where: { id, ownerWorkosUserId: user.id } }),
  ]);
  const entityPairs = await Promise.all(
    analysis.knowledgeEntityMentions.map(async (mention) => {
      const entity = await getKnowledgeEntityDTO(mention.entityId);
      return entity ? ([mention.localEntityId, entity] as const) : null;
    }),
  );
  const relationPairs = await Promise.all(
    analysis.knowledgeRelationMentions.map(async (mention) => {
      if (!mention.relationId) return null;
      const relation = await getKnowledgeRelationDTO(mention.relationId);
      return relation ? ([mention.localRelationId, relation] as const) : null;
    }),
  );
  const context = readLiveContext(analysis.liveContext);
  const transcript = analysis.transcript ?? analysis.text;

  return (
    <ContextReviewWorkspace
      id={analysis.id}
      title={
        resolveAnalysisTitle({
          title: analysis.title,
          source: analysis.source,
          createdAt: analysis.createdAt,
          summary: analysis.summary,
          transcript,
          language: analysis.language,
        }) ?? "Jiddu Context"
      }
      transcript={transcript}
      diarization={readSavedDiarization(analysis.diarizedTranscript)}
      sentences={parseArray<Sentence>(analysis.sentences)}
      audioDurationMs={analysis.audioDurationMs}
      replayEvents={analysis.contextSessionEvents
        .map(parseContextReplayEvent)
        .filter(isPresent)}
      context={context}
      findings={parseArray<Finding>(analysis.findings)}
      claims={parseArray<LiveClaim>(factCheck?.claims)}
      verdicts={parseArray<Verdict>(factCheck?.verdicts)}
      neutralityFindings={parseArray<NeutralityFinding>(neutrality?.findings)}
      neutralityVerdict={
        neutrality
          ? {
              verdict: neutrality.verdict as NeutralityVerdictValue,
              confidence: neutrality.confidence,
              rationale: neutrality.rationale ?? "",
            }
          : null
      }
      enrichedEntities={entityPairs.filter(isPresent)}
      enrichedRelations={relationPairs.filter(isPresent)}
    />
  );
}

function parseArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? (value as T[]) : [];
  } catch {
    return [];
  }
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}
