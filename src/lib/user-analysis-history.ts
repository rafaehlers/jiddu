import "server-only";

import { prisma } from "@/lib/db";

export type UserAnalysisKind =
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
    select,
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
    prisma.analysis.findMany(query),
    prisma.factCheck.findMany(query),
    prisma.neutrality.findMany(query),
    prisma.explanation.findMany(query),
    prisma.slopCheck.findMany(query),
    prisma.paperReview.findMany(query),
  ]);

  return [
    ...analyses.map((row) => ({ ...row, kind: "fallacy" as const })),
    ...factChecks.map((row) => ({ ...row, kind: "factcheck" as const })),
    ...neutralities.map((row) => ({ ...row, kind: "neutrality" as const })),
    ...explanations.map((row) => ({ ...row, kind: "explain" as const })),
    ...slopChecks.map((row) => ({ ...row, kind: "slop" as const })),
    ...paperReviews.map((row) => ({ ...row, kind: "review" as const })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, MAX_HISTORY_ROWS);
}
