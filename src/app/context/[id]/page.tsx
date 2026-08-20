import { withAuth } from "@workos-inc/authkit-nextjs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContextReviewWorkspace } from "@/components/context/context-review-workspace";
import {
  getKnowledgeEntityDTO,
  getKnowledgeRelationDTO,
} from "@/lib/context-knowledge";
import { parseContextReplayEvent } from "@/lib/context-replay-schema";
import { canManageContextSession } from "@/lib/context-session-access";
import { isWorkOSConfigured } from "@/lib/auth-config";
import { prisma } from "@/lib/db";
import { readLiveContext } from "@/lib/live-context-schema";
import { readSavedDiarization } from "@/lib/live/diarization";
import { resolveAnalysisTitle } from "@/lib/live-title";
import type { LiveClaim } from "@/lib/live/use-live-analysis";
import { loadSettings } from "@/lib/settings";
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
  const { user } = isWorkOSConfigured()
    ? await withAuth()
    : { user: null };

  const analysis = await prisma.analysis.findFirst({
    where: { id, source: "live" },
    include: {
      knowledgeEntityMentions: true,
      knowledgeRelationMentions: true,
      contextSessionEvents: {
        orderBy: [{ elapsedMs: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!analysis) notFound();
  const canManage = canManageContextSession(
    user?.id,
    analysis.ownerWorkosUserId,
  );

  const [factCheck, neutrality, settings] = await Promise.all([
    prisma.factCheck.findFirst({
      where: { id, ownerWorkosUserId: analysis.ownerWorkosUserId },
    }),
    prisma.neutrality.findFirst({
      where: { id, ownerWorkosUserId: analysis.ownerWorkosUserId },
    }),
    loadSettings(),
  ]);
  const maxRefreshPerClaim = Math.max(
    1,
    Math.floor(settings["factcheck.maxRefreshPerClaim"]),
  );
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
      canManage={canManage}
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
      initialRefreshCounts={parseCounts(factCheck?.refreshCounts)}
      maxRefreshPerClaim={maxRefreshPerClaim}
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

function parseCounts(raw: string | null | undefined): Record<string, number> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const counts: Record<string, number> = {};
      for (const [claimId, value] of Object.entries(
        parsed as Record<string, unknown>,
      )) {
        if (typeof value === "number" && Number.isFinite(value)) {
          counts[claimId] = value;
        }
      }
      return counts;
    }
  } catch {
    // Fall back to no recorded refreshes for legacy or malformed rows.
  }
  return {};
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}
