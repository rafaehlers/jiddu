import { withAuth } from "@workos-inc/authkit-nextjs";
import { z } from "zod";
import {
  mergeContextEntities,
  removeContextEntity,
  renameContextEntity,
  replaceEntityName,
  replaceEntityNamesInClaims,
} from "@/lib/context-session-mutations";
import { syncContextKnowledgeMentions } from "@/lib/context-knowledge";
import { recordContextSessionEvents } from "@/lib/context-session-events";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { readLiveContext } from "@/lib/live-context-schema";
import type { LiveClaim } from "@/lib/live/use-live-analysis";
import type { Finding } from "@/lib/schema";
import type { NeutralityFinding } from "@/lib/neutrality-schema";
import { liveSpeakerAttribution } from "@/lib/live-analysis-config";

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

type MutationPayload = z.infer<typeof MutationSchema>;
const SERIALIZABLE_ATTEMPTS = 3;

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
  try {
    const result = await mutateEntitySerializable({
      analysisId: id,
      ownerWorkosUserId: user.id,
      mutation: payload.data,
    });

    // Rebuild only this user's private session index. Public profiles and
    // globally attributed knowledge rows are intentionally left untouched.
    await syncContextKnowledgeMentions({
      analysisId: id,
      ownerWorkosUserId: user.id,
      context: result.context,
    });

    try {
      await recordContextSessionEvents({
        analysisId: id,
        ownerWorkosUserId: user.id,
        events: [
          {
            kind:
              payload.data.action === "rename"
                ? "entity_renamed"
                : payload.data.action === "merge"
                  ? "entities_merged"
                  : "entity_removed",
            elapsedMs:
              payload.data.elapsedMs ?? result.audioDurationMs ?? 0,
            sentenceIds: [],
            payload: payload.data,
          },
          {
            kind: "context_snapshot",
            elapsedMs:
              payload.data.elapsedMs ?? result.audioDurationMs ?? 0,
            sentenceIds: mutationSentenceIds(result.context),
            payload: result.context,
          },
        ],
      });
    } catch (eventError) {
      // Replay history is additive. The private mutation remains valid if
      // the timeline store is temporarily unavailable.
      console.error("[context/entities] replay event failed", eventError);
    }

    return Response.json({
      context: result.context,
      claims: result.claims,
      findings: result.findings,
      neutralityFindings: result.neutralityFindings,
      verdicts: [],
      verificationReset: result.verificationReset,
    });
  } catch (error) {
    if (error instanceof ContextMutationRequestError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Mutation failed";
    const status = /not found|same type|itself|empty/i.test(message)
      ? 422
      : 500;
    return Response.json({ error: message }, { status });
  }
}

async function mutateEntitySerializable(input: {
  analysisId: string;
  ownerWorkosUserId: string;
  mutation: MutationPayload;
}) {
  return serializableTransaction(async (tx) => {
    const [analysis, factCheck, neutrality] = await Promise.all([
      tx.analysis.findFirst({
        where: {
          id: input.analysisId,
          ownerWorkosUserId: input.ownerWorkosUserId,
          source: "live",
        },
        select: {
          id: true,
          liveContext: true,
          findings: true,
          audioDurationMs: true,
        },
      }),
      tx.factCheck.findFirst({
        where: {
          id: input.analysisId,
          ownerWorkosUserId: input.ownerWorkosUserId,
        },
        select: { claims: true, verifyStatus: true },
      }),
      tx.neutrality.findFirst({
        where: {
          id: input.analysisId,
          ownerWorkosUserId: input.ownerWorkosUserId,
        },
        select: { findings: true },
      }),
    ]);
    if (!analysis) throw new ContextMutationRequestError("Not found", 404);
    if (factCheck?.verifyStatus === "running") {
      throw new ContextMutationRequestError(
        "Wait for the current verification to finish.",
        409,
      );
    }

    const currentContext = readLiveContext(analysis.liveContext);
    const currentClaims = parseClaims(factCheck?.claims);
    let context;
    let claims: LiveClaim[];
    let verificationReset = false;
    let replacements: Array<{ from: string; to: string }> = [];
    if (input.mutation.action === "rename") {
      const renamed = renameContextEntity(
        currentContext,
        input.mutation.localEntityId,
        input.mutation.name,
      );
      context = renamed.context;
      claims = replaceEntityNamesInClaims(currentClaims, [
        { from: renamed.previousName, to: renamed.currentName },
      ]);
      replacements = [
        { from: renamed.previousName, to: renamed.currentName },
      ];
      verificationReset = true;
    } else if (input.mutation.action === "merge") {
      const merged = mergeContextEntities(
        currentContext,
        input.mutation.sourceLocalEntityId,
        input.mutation.targetLocalEntityId,
      );
      context = merged.context;
      claims = replaceEntityNamesInClaims(currentClaims, [
        { from: merged.sourceName, to: merged.mergedName },
        { from: merged.previousTargetName, to: merged.mergedName },
      ]);
      replacements = [
        { from: merged.sourceName, to: merged.mergedName },
        { from: merged.previousTargetName, to: merged.mergedName },
      ];
      verificationReset = true;
    } else {
      context = removeContextEntity(
        currentContext,
        input.mutation.localEntityId,
      ).context;
      claims = currentClaims;
    }
    const speakerAttribution = liveSpeakerAttribution(
      context.analysisConfig,
    );
    if (speakerAttribution) {
      claims = claims.map((claim) => ({ ...claim, ...speakerAttribution }));
    }
    const findings = applySpeakerAttribution(
      replaceNamesInAttributedFindings(
        parseArray<Finding>(analysis.findings),
        replacements,
      ),
      speakerAttribution,
    );
    const neutralityFindings = applySpeakerAttribution(
      replaceNamesInAttributedFindings(
        parseArray<NeutralityFinding>(neutrality?.findings),
        replacements,
      ),
      speakerAttribution,
    );

    await tx.analysis.update({
      where: { id: input.analysisId },
      data: {
        liveContext: JSON.stringify(context),
        findings: JSON.stringify(findings),
        contextRevision: { increment: 1 },
      },
    });
    if (factCheck && verificationReset) {
      await tx.factCheck.update({
        where: { id: input.analysisId },
        data: {
          claims: JSON.stringify(claims),
          verdicts: JSON.stringify([]),
          refreshCounts: JSON.stringify({}),
          verifyStatus: "none",
          verifyModel: null,
          verifyStartedAt: null,
          verifyFinishedAt: null,
          errorMessage: null,
        },
      });
    }
    if (neutrality && replacements.length > 0) {
      await tx.neutrality.update({
        where: { id: input.analysisId },
        data: { findings: JSON.stringify(neutralityFindings) },
      });
    }
    await tx.knowledgeRelationMention.deleteMany({
      where: {
        analysisId: input.analysisId,
        ownerWorkosUserId: input.ownerWorkosUserId,
      },
    });
    await tx.knowledgeEntityMention.deleteMany({
      where: {
        analysisId: input.analysisId,
        ownerWorkosUserId: input.ownerWorkosUserId,
      },
    });

    return {
      context,
      claims,
      findings,
      neutralityFindings,
      verificationReset,
      audioDurationMs: analysis.audioDurationMs,
    };
  });
}

function replaceNamesInAttributedFindings<
  T extends { explanation: string; speakerName?: string },
>(values: T[], replacements: ReadonlyArray<{ from: string; to: string }>): T[] {
  return values.map((value) => ({
    ...value,
    explanation: replacements.reduce(
      (text, replacement) =>
        replaceEntityName(text, replacement.from, replacement.to),
      value.explanation,
    ),
    speakerName: value.speakerName
      ? replacements.reduce(
          (text, replacement) =>
            replaceEntityName(text, replacement.from, replacement.to),
          value.speakerName,
        )
      : undefined,
  }));
}

function applySpeakerAttribution<T extends Record<string, unknown>>(
  values: T[],
  attribution: ReturnType<typeof liveSpeakerAttribution>,
): T[] {
  if (!attribution) return values;
  return values.map((value) => ({ ...value, ...attribution }));
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

async function serializableTransaction<T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < SERIALIZABLE_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(work, {
        isolationLevel: "Serializable",
      });
    } catch (error) {
      lastError = error;
      if (!isPrismaError(error, "P2034")) throw error;
    }
  }
  throw lastError;
}

function isPrismaError(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

class ContextMutationRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
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
