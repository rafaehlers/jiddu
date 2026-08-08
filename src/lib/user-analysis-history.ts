import "server-only";

import { prisma } from "@/lib/db";
import { resolveAnalysisTitle } from "@/lib/live-title";
import { readLiveContext } from "@/lib/live-context-schema";
import { LIVE_DIARIZATION_MODEL } from "@/lib/model-ids";

export type UserAnalysisKind =
  | "context"
  | "diarization"
  | "fallacy"
  | "factcheck"
  | "neutrality"
  | "explain"
  | "slop"
  | "review";

export type UserAnalysisRow = {
  kind: UserAnalysisKind;
  id: string;
  title: string | null;
  source: string;
  sourceRef: string | null;
  model: string;
  status: string;
  createdAt: Date;
};

const MAX_HISTORY_ROWS = 100;

export async function listUserAnalyses(
  ownerWorkosUserId: string,
): Promise<UserAnalysisRow[]> {
  const where = { ownerWorkosUserId };
  const select = {
    id: true,
    title: true,
    source: true,
    sourceRef: true,
    model: true,
    status: true,
    createdAt: true,
  } as const;
  const query = {
    where,
    orderBy: { createdAt: "desc" as const },
    take: MAX_HISTORY_ROWS,
  };

  const [
    analyses,
    factChecks,
    neutralities,
    explanations,
    slopChecks,
    paperReviews,
  ] = await Promise.all([
    prisma.analysis.findMany({
      ...query,
      select: {
        ...select,
        summary: true,
        transcript: true,
        diarizedTranscript: true,
        diarizedAt: true,
        language: true,
        liveContext: true,
      },
    }),
    prisma.factCheck.findMany({ ...query, select }),
    prisma.neutrality.findMany({ ...query, select }),
    prisma.explanation.findMany({ ...query, select }),
    prisma.slopCheck.findMany({ ...query, select }),
    prisma.paperReview.findMany({ ...query, select }),
  ]);

  return [
    ...analyses.flatMap((row) => {
      if (!row.diarizedTranscript) return [];
      return [
        {
          kind: "diarization" as const,
          id: row.id,
          title: resolveAnalysisTitle({
            title: row.title,
            source: row.source,
            createdAt: row.createdAt,
            summary: row.summary,
            transcript: row.transcript,
            language: row.language,
          }),
          source: row.source,
          sourceRef: row.sourceRef,
          model: LIVE_DIARIZATION_MODEL,
          status: "complete",
          createdAt: row.diarizedAt ?? row.createdAt,
        },
      ];
    }),
    ...analyses.flatMap((row) => {
      if (row.source !== "live") return [];
      const context = readLiveContext(row.liveContext);
      const hasContext =
        context.tags.length > 0 ||
        context.relatedLinks.length > 0 ||
        context.topics.length > 0 ||
        context.terms.length > 0 ||
        context.segments.length > 0 ||
        Boolean(context.summary);
      if (!hasContext) return [];
      return [
        {
          kind: "context" as const,
          id: row.id,
          title: resolveAnalysisTitle({
            title: row.title,
            source: row.source,
            createdAt: row.createdAt,
            summary: row.summary,
            transcript: row.transcript,
            language: row.language,
          }),
          source: row.source,
          sourceRef: row.sourceRef,
          model: row.model,
          status: row.status,
          createdAt: row.createdAt,
        },
      ];
    }),
    ...analyses.map((row) => ({
      kind: "fallacy" as const,
      id: row.id,
      title: resolveAnalysisTitle({
        title: row.title,
        source: row.source,
        createdAt: row.createdAt,
        summary: row.summary,
        transcript: row.transcript,
        language: row.language,
      }),
      source: row.source,
      sourceRef: row.sourceRef,
      model: row.model,
      status: row.status,
      createdAt: row.createdAt,
    })),
    ...factChecks.map((row) => ({ ...row, kind: "factcheck" as const })),
    ...neutralities.map((row) => ({ ...row, kind: "neutrality" as const })),
    ...explanations.map((row) => ({ ...row, kind: "explain" as const })),
    ...slopChecks.map((row) => ({ ...row, kind: "slop" as const })),
    ...paperReviews.map((row) => ({ ...row, kind: "review" as const })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, MAX_HISTORY_ROWS);
}
