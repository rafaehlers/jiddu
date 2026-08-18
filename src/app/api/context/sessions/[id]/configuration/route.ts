import { withAuth } from "@workos-inc/authkit-nextjs";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { recordContextSessionEvents } from "@/lib/context-session-events";
import { replaceEntityName } from "@/lib/context-session-mutations";
import { syncContextKnowledgeMentions } from "@/lib/context-knowledge";
import { prisma } from "@/lib/db";
import {
  LiveAnalysisConfigSchema,
  liveSpeakerAttribution,
  type LiveAnalysisConfig,
} from "@/lib/live-analysis-config";
import { applyLiveAnalysisConfig } from "@/lib/live-analysis-context";
import { readLiveContext } from "@/lib/live-context-schema";
import type { LiveClaim } from "@/lib/live/use-live-analysis";
import type { NeutralityFinding } from "@/lib/neutrality-schema";
import type { Finding } from "@/lib/schema";

export const runtime = "nodejs";

const BodySchema = z.object({
  config: LiveAnalysisConfigSchema,
  lang: z.enum(["en", "pt", "es"]).default("en"),
  elapsedMs: z.number().int().nonnegative().optional(),
});

const SERIALIZABLE_ATTEMPTS = 3;

export async function PATCH(
  request: Request,
  routeContext: { params: Promise<{ id: string }> },
) {
  const { user } = await withAuth();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = BodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return Response.json(
      { error: "Invalid analysis configuration." },
      { status: 400 },
    );
  }

  const { id } = await routeContext.params;
  try {
    const result = await serializableTransaction(async (tx) => {
      const [analysis, factCheck, neutrality] = await Promise.all([
        tx.analysis.findFirst({
          where: { id, ownerWorkosUserId: user.id, source: "live" },
          select: {
            id: true,
            liveContext: true,
            findings: true,
            audioDurationMs: true,
          },
        }),
        tx.factCheck.findFirst({
          where: { id, ownerWorkosUserId: user.id },
          select: { claims: true, verifyStatus: true },
        }),
        tx.neutrality.findFirst({
          where: { id, ownerWorkosUserId: user.id },
          select: { findings: true },
        }),
      ]);
      if (!analysis) throw new ConfigurationRequestError("Not found", 404);

      const previousContext = readLiveContext(analysis.liveContext);
      const previousConfig = previousContext.analysisConfig;
      const context = applyLiveAnalysisConfig(
        previousContext,
        body.data.config,
        body.data.lang,
      );
      const namesChanged = primarySpeakerName(previousConfig) !==
        primarySpeakerName(context.analysisConfig);
      if (namesChanged && factCheck?.verifyStatus === "running") {
        throw new ConfigurationRequestError(
          "Wait for the current verification to finish.",
          409,
        );
      }

      const findings = reconcileAttribution(
        parseArray<Finding>(analysis.findings),
        previousConfig,
        context.analysisConfig,
        ["explanation"],
      );
      const claims = reconcileAttribution(
        parseArray<LiveClaim>(factCheck?.claims),
        previousConfig,
        context.analysisConfig,
        ["statement", "rationale"],
      );
      const neutralityFindings = reconcileAttribution(
        parseArray<NeutralityFinding>(neutrality?.findings),
        previousConfig,
        context.analysisConfig,
        ["explanation"],
      );

      await tx.analysis.update({
        where: { id },
        data: {
          liveContext: JSON.stringify(context),
          findings: JSON.stringify(findings),
          contextRevision: { increment: 1 },
        },
      });
      if (factCheck) {
        await tx.factCheck.update({
          where: { id },
          data: {
            claims: JSON.stringify(claims),
            ...(namesChanged
              ? {
                  verdicts: JSON.stringify([]),
                  refreshCounts: JSON.stringify({}),
                  verifyStatus: "none",
                  verifyModel: null,
                  verifyStartedAt: null,
                  verifyFinishedAt: null,
                  errorMessage: null,
                }
              : {}),
          },
        });
      }
      if (neutrality) {
        await tx.neutrality.update({
          where: { id },
          data: { findings: JSON.stringify(neutralityFindings) },
        });
      }
      await tx.knowledgeRelationMention.deleteMany({
        where: { analysisId: id, ownerWorkosUserId: user.id },
      });
      await tx.knowledgeEntityMention.deleteMany({
        where: { analysisId: id, ownerWorkosUserId: user.id },
      });

      return {
        context,
        findings,
        claims,
        neutralityFindings,
        verificationReset: namesChanged,
        audioDurationMs: analysis.audioDurationMs,
      };
    });

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
            kind: "context_snapshot",
            elapsedMs:
              body.data.elapsedMs ?? result.audioDurationMs ?? 0,
            sentenceIds: result.context.entities.flatMap(
              (entity) => entity.sentenceIds,
            ),
            payload: result.context,
          },
        ],
      });
    } catch (eventError) {
      console.error("[context/configuration] replay event failed", eventError);
    }

    return Response.json(result);
  } catch (error) {
    if (error instanceof ConfigurationRequestError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("[context/configuration] update failed", error);
    return Response.json(
      { error: "The analysis configuration could not be saved." },
      { status: 500 },
    );
  }
}

function reconcileAttribution<T extends Record<string, unknown>>(
  values: T[],
  previousConfig: LiveAnalysisConfig,
  nextConfig: LiveAnalysisConfig,
  textKeys: Array<keyof T>,
): T[] {
  const previous = liveSpeakerAttribution(previousConfig);
  const next = liveSpeakerAttribution(nextConfig);
  return values.map((value) => {
    const result = { ...value };
    if (previous && next && previous.speakerName !== next.speakerName) {
      for (const key of textKeys) {
        const text = result[key];
        if (typeof text === "string") {
          result[key] = replaceEntityName(
            text,
            previous.speakerName,
            next.speakerName,
          ) as T[typeof key];
        }
      }
    }
    if (next) {
      Object.assign(result, next);
    } else {
      delete result.speakerId;
      delete result.speakerName;
      delete result.speakerRole;
    }
    return result;
  });
}

function primarySpeakerName(config: LiveAnalysisConfig): string | null {
  return liveSpeakerAttribution(config)?.speakerName ?? null;
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

class ConfigurationRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
