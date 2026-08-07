import { withAuth } from "@workos-inc/authkit-nextjs";
import { z } from "zod";
import {
  mergeContextEntities,
  removeContextEntity,
  renameContextEntity,
  replaceEntityNamesInClaims,
} from "@/lib/context-session-mutations";
import { syncContextKnowledgeMentions } from "@/lib/context-knowledge";
import { recordContextSessionEvents } from "@/lib/context-session-events";
import { prisma } from "@/lib/db";
import { readLiveContext } from "@/lib/live-context-schema";
import type { LiveClaim } from "@/lib/live/use-live-analysis";

export const runtime = "nodejs";

const MutationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("rename"),
    localEntityId: z.string().trim().min(1).max(120),
    name: z.string().trim().min(1).max(240),
    elapsedMs: z.number().int().nonnegative().optional(),
  }),
  z.object({
    action: z.literal("merge"),
    sourceLocalEntityId: z.string().trim().min(1).max(120),
    targetLocalEntityId: z.string().trim().min(1).max(120),
    elapsedMs: z.number().int().nonnegative().optional(),
  }),
  z.object({
    action: z.literal("remove"),
    localEntityId: z.string().trim().min(1).max(120),
    elapsedMs: z.number().int().nonnegative().optional(),
  }),
]);

export async function PATCH(
  request: Request,
  routeContext: { params: Promise<{ id: string }> },
) {
  const { user } = await withAuth();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const payload = MutationSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!payload.success) {
    return Response.json(
      { error: "Invalid entity mutation." },
      { status: 400 },
    );
  }

  const { id } = await routeContext.params;
  const [analysis, factCheck] = await Promise.all([
    prisma.analysis.findFirst({
      where: { id, ownerWorkosUserId: user.id, source: "live" },
      select: { id: true, liveContext: true, audioDurationMs: true },
    }),
    prisma.factCheck.findFirst({
      where: { id, ownerWorkosUserId: user.id },
      select: { claims: true, verifyStatus: true },
    }),
  ]);
  if (!analysis) return Response.json({ error: "Not found" }, { status: 404 });
  if (factCheck?.verifyStatus === "running") {
    return Response.json(
      { error: "Wait for the current verification to finish." },
      { status: 409 },
    );
  }

  const currentContext = readLiveContext(analysis.liveContext);
  const currentClaims = parseClaims(factCheck?.claims);

  try {
    let nextContext;
    let nextClaims: LiveClaim[];
    let verificationReset = false;
    if (payload.data.action === "rename") {
      const renamed = renameContextEntity(
        currentContext,
        payload.data.localEntityId,
        payload.data.name,
      );
      nextContext = renamed.context;
      nextClaims = replaceEntityNamesInClaims(currentClaims, [
        { from: renamed.previousName, to: renamed.currentName },
      ]);
      verificationReset = true;
    } else if (payload.data.action === "merge") {
      const merged = mergeContextEntities(
        currentContext,
        payload.data.sourceLocalEntityId,
        payload.data.targetLocalEntityId,
      );
      nextContext = merged.context;
      nextClaims = replaceEntityNamesInClaims(currentClaims, [
        { from: merged.sourceName, to: merged.mergedName },
        { from: merged.previousTargetName, to: merged.mergedName },
      ]);
      verificationReset = true;
    } else {
      const removed = removeContextEntity(
        currentContext,
        payload.data.localEntityId,
      );
      nextContext = removed.context;
      nextClaims = currentClaims;
    }

    await prisma.$transaction([
      prisma.analysis.update({
        where: { id },
        data: { liveContext: JSON.stringify(nextContext) },
      }),
      ...(factCheck && verificationReset
        ? [
            prisma.factCheck.update({
              where: { id },
              data: {
                claims: JSON.stringify(nextClaims),
                verdicts: JSON.stringify([]),
                refreshCounts: JSON.stringify({}),
                verifyStatus: "none",
                verifyModel: null,
                verifyStartedAt: null,
                verifyFinishedAt: null,
                errorMessage: null,
              },
            }),
          ]
        : []),
      prisma.knowledgeRelationMention.deleteMany({
        where: { analysisId: id, ownerWorkosUserId: user.id },
      }),
      prisma.knowledgeEntityMention.deleteMany({
        where: { analysisId: id, ownerWorkosUserId: user.id },
      }),
    ]);

    // Rebuild only this user's private session index. Public profiles and
    // globally attributed knowledge rows are intentionally left untouched.
    await syncContextKnowledgeMentions({
      analysisId: id,
      ownerWorkosUserId: user.id,
      context: nextContext,
    });

    try {
      await recordContextSessionEvents({
        analysisId: id,
        ownerWorkosUserId: user.id,
        events: [
          {
            kind: "context_snapshot",
            elapsedMs:
              payload.data.elapsedMs ?? analysis.audioDurationMs ?? 0,
            sentenceIds: mutationSentenceIds(nextContext),
            payload: nextContext,
          },
        ],
      });
    } catch (eventError) {
      // Replay history is additive. The private mutation remains valid if
      // the timeline store is temporarily unavailable.
      console.error("[context/entities] replay event failed", eventError);
    }

    return Response.json({
      context: nextContext,
      claims: nextClaims,
      verdicts: [],
      verificationReset,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mutation failed";
    const status = /not found|same type|itself|empty/i.test(message)
      ? 422
      : 500;
    return Response.json({ error: message }, { status });
  }
}

function mutationSentenceIds(
  context: ReturnType<typeof readLiveContext>,
): string[] {
  return Array.from(
    new Set([
      ...context.entities.flatMap((entity) => entity.sentenceIds),
      ...context.relations.flatMap((relation) => relation.sentenceIds),
    ]),
  );
}

function parseClaims(raw: string | null | undefined): LiveClaim[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? (value as LiveClaim[]) : [];
  } catch {
    return [];
  }
}
