import { after, NextRequest } from "next/server";
import { ContextNewsRequestSchema } from "@/lib/context-knowledge-schema";
import {
  assertOwnedContextSession,
  attachNewsToEntity,
  CONTEXT_NEWS_TTL_MS,
  getKnowledgeEntityDTO,
  getKnowledgeCoverageRelation,
  upsertKnowledgeEntityFromLive,
  upsertKnowledgeEntityMention,
  upsertKnowledgeRelationFromCoverage,
  upsertKnowledgeRelationMention,
} from "@/lib/context-knowledge";
import { findContextNews } from "@/lib/llm/context-news";
import {
  isAccessResponse,
  requireWebAnalysisAccess,
  type WebAnalysisAccess,
} from "@/lib/web-analysis-access";
import {
  createWebAnalysisUsageSettlement,
  isCreditResponse,
  reserveWebAnalysisCredits,
} from "@/lib/web-credit-billing";
import { modelCreditRate } from "@/lib/jiddu-credit-rates";
import { consume, rateLimitResponse } from "@/lib/rate-limit";
import {
  bucketFromSettings,
  loadSettings,
  loadStringSettings,
  type PerplexitySearchModelSetting,
} from "@/lib/settings";
import type { OpenRouterUsage } from "@/lib/openrouter-usage";
import {
  hasFreshKnowledgeSource,
  hasKnowledgeSource,
} from "@/lib/context-knowledge-cache";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const access = await requireWebAnalysisAccess();
  if (isAccessResponse(access)) return access;

  const body = ContextNewsRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!body.success) {
    return Response.json({ error: "Invalid news payload." }, { status: 400 });
  }
  const session = await assertOwnedContextSession(
    body.data.sessionId,
    access.userId!,
  );
  if (!session) return Response.json({ error: "Not found" }, { status: 404 });

  const [settings, stringSettings] = await Promise.all([
    loadSettings(),
    loadStringSettings(),
  ]);
  const newsModel = stringSettings["context.newsModel"];
  const rate = consume(
    `context:news:${access.userId}`,
    bucketFromSettings(settings, "rate.liveAnalyze"),
  );
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);

  if (body.data.target === "entity") {
    const entityRequest = body.data;
    if (entityRequest.entity.importance < 0.78) {
      return Response.json({ error: "Entity is below the news threshold." }, { status: 422 });
    }
    const stored = await upsertKnowledgeEntityFromLive(entityRequest.entity);
    await upsertKnowledgeEntityMention({
      analysisId: session.id,
      ownerWorkosUserId: access.userId!,
      storedEntityId: stored.id,
      entity: entityRequest.entity,
    });
    const cached = await getKnowledgeEntityDTO(stored.id);
    const refreshEntity = async (onUsage: (usage: OpenRouterUsage) => void) => {
      const results = await findContextNews(
        {
          kind: "entity" as const,
          name: entityRequest.entity.name,
          description: entityRequest.entity.description,
          lang: entityRequest.language,
          sourceUrl: session.sourceRef,
        },
        { apiKey: access.apiKey, model: newsModel, onUsage },
      );
      const entity = await attachNewsToEntity(stored.id, results);
      return { target: "entity" as const, entity, cached: false };
    };
    if (
      cached &&
      hasFreshKnowledgeSource(cached.sources, "news", CONTEXT_NEWS_TTL_MS)
    ) {
      return Response.json({ target: "entity", entity: cached, cached: true });
    }
    if (cached && hasKnowledgeSource(cached.sources, "news")) {
      return scheduleBillableNews(
        access,
        session.id,
        newsModel,
        refreshEntity,
        { target: "entity", entity: cached, cached: true },
      );
    }
    return runBillableNews(access, session.id, newsModel, refreshEntity);
  }

  const relationRequest = body.data;
  if (relationRequest.relation.importance < 0.82) {
    return Response.json({ error: "Relation is below the news threshold." }, { status: 422 });
  }
  const [sourceStored, targetStored] = await Promise.all([
    upsertKnowledgeEntityFromLive(relationRequest.sourceEntity),
    upsertKnowledgeEntityFromLive(relationRequest.targetEntity),
  ]);
  await Promise.all([
    upsertKnowledgeEntityMention({
      analysisId: session.id,
      ownerWorkosUserId: access.userId!,
      storedEntityId: sourceStored.id,
      entity: relationRequest.sourceEntity,
    }),
    upsertKnowledgeEntityMention({
      analysisId: session.id,
      ownerWorkosUserId: access.userId!,
      storedEntityId: targetStored.id,
      entity: relationRequest.targetEntity,
    }),
    upsertKnowledgeRelationMention({
      analysisId: session.id,
      ownerWorkosUserId: access.userId!,
      sourceEntityId: sourceStored.id,
      targetEntityId: targetStored.id,
      sourceLocalEntityId: relationRequest.sourceEntity.id,
      targetLocalEntityId: relationRequest.targetEntity.id,
      relation: relationRequest.relation,
    }),
  ]);
  const cachedRelation = await getKnowledgeCoverageRelation({
    sourceEntityId: sourceStored.id,
    targetEntityId: targetStored.id,
  });
  const refreshRelation = async (
    onUsage: (usage: OpenRouterUsage) => void,
  ) => {
    const results = await findContextNews(
      {
        kind: "relation" as const,
        sourceName: relationRequest.sourceEntity.name,
        targetName: relationRequest.targetEntity.name,
        label: relationRequest.relation.label,
        description: relationRequest.relation.description,
        lang: relationRequest.language,
        sourceUrl: session.sourceRef,
      },
      { apiKey: access.apiKey, model: newsModel, onUsage },
    );
    const relation =
      results.length > 0
        ? await upsertKnowledgeRelationFromCoverage({
            sessionId: session.id,
            sourceEntityId: sourceStored.id,
            targetEntityId: targetStored.id,
            relation: relationRequest.relation,
            results,
          })
        : cachedRelation;
    return { target: "relation" as const, relation, cached: false };
  };
  if (
    cachedRelation &&
    hasFreshKnowledgeSource(
      cachedRelation.sources,
      "news",
      CONTEXT_NEWS_TTL_MS,
    )
  ) {
    return Response.json({
      target: "relation",
      relation: cachedRelation,
      cached: true,
    });
  }
  if (
    cachedRelation &&
    hasKnowledgeSource(cachedRelation.sources, "news")
  ) {
    return scheduleBillableNews(
      access,
      session.id,
      newsModel,
      refreshRelation,
      { target: "relation", relation: cachedRelation, cached: true },
    );
  }
  return runBillableNews(access, session.id, newsModel, refreshRelation);
}

async function scheduleBillableNews<
  T extends Record<string, unknown>,
  C extends Record<string, unknown>,
>(
  access: WebAnalysisAccess,
  sessionId: string,
  model: PerplexitySearchModelSetting,
  operation: (onUsage: (usage: OpenRouterUsage) => void) => Promise<T>,
  cachedResult: C,
): Promise<Response> {
  const reservation = await reserveWebAnalysisCredits(access, {
    amount: modelCreditRate(model),
    feature: "live_analysis",
    resourceId: sessionId,
    metadata: { stage: "context_news", model },
  });
  if (isCreditResponse(reservation)) {
    return Response.json({
      ...cachedResult,
      stale: true,
      refreshScheduled: false,
    });
  }
  const usages: OpenRouterUsage[] = [];
  const settle = createWebAnalysisUsageSettlement(access, reservation, {
    feature: "live_analysis",
    resourceId: sessionId,
    metadata: { stage: "context_news", model },
  });
  after(async () => {
    try {
      await operation((usage) => usages.push(usage));
    } catch (error) {
      console.error("[/api/context/news] background refresh failed", error);
    } finally {
      await settle({ usages, fallbackModels: [model] });
    }
  });
  return Response.json({
    ...cachedResult,
    stale: true,
    refreshScheduled: true,
  });
}

async function runBillableNews<T>(
  access: WebAnalysisAccess,
  sessionId: string,
  model: PerplexitySearchModelSetting,
  operation: (onUsage: (usage: OpenRouterUsage) => void) => Promise<T>,
): Promise<Response> {
  const reservation = await reserveWebAnalysisCredits(access, {
    amount: modelCreditRate(model),
    feature: "live_analysis",
    resourceId: sessionId,
    metadata: { stage: "context_news", model },
  });
  if (isCreditResponse(reservation)) return reservation;
  const usages: OpenRouterUsage[] = [];
  const settle = createWebAnalysisUsageSettlement(access, reservation, {
    feature: "live_analysis",
    resourceId: sessionId,
    metadata: { stage: "context_news", model },
  });
  try {
    const result = await operation((usage) => usages.push(usage));
    await settle({ usages, fallbackModels: [model] });
    return Response.json(result);
  } catch (error) {
    await settle({ usages, fallbackModels: [model] });
    console.error("[/api/context/news] enrichment failed", error);
    return Response.json(
      { error: "Recent coverage could not be loaded." },
      { status: 502 },
    );
  }
}
