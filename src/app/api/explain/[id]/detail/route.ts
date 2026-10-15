import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { loadAnalysisRouting } from "@/lib/analysis-routing";
import { selectExplainDetailSource } from "@/lib/explain-detail";
import { normalizeLevel, type ExplainFinding } from "@/lib/explain-schema";
import { normalizeAppLanguage } from "@/lib/language";
import { getProvider } from "@/lib/llm";
import { withModelFallbackPromise } from "@/lib/llm/fallback";
import { maxCreditsForCalls } from "@/lib/jiddu-credit-rates";
import type { OpenRouterUsage } from "@/lib/openrouter-usage";
import type { Block } from "@/lib/paragraphs";
import { consume, ipFromRequest, rateLimitResponse } from "@/lib/rate-limit";
import { bucketFromSettings, loadSettings } from "@/lib/settings";
import { isAccessResponse, requireWebAnalysisAccess } from "@/lib/web-analysis-access";
import {
  createWebAnalysisUsageSettlement,
  isCreditResponse,
  reserveWebAnalysisCredits,
} from "@/lib/web-credit-billing";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const access = await requireWebAnalysisAccess();
  if (isAccessResponse(access)) return access;

  const settings = await loadSettings();
  const limit = consume(
    `explain-detail:${ipFromRequest(req)}`,
    bucketFromSettings(settings, "rate.analyze"),
  );
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSec);

  const body = await req.json().catch(() => null);
  if (typeof body?.blockId !== "string" || body.blockId.length > 200) {
    return Response.json({ error: "Invalid block id" }, { status: 400 });
  }
  const { id } = await ctx.params;
  // Explanation pages are already readable through their share URL. A reader
  // can request a private follow-up using their own access and credits; this
  // does not edit the shared report or charge its owner.
  const report = await prisma.explanation.findUnique({ where: { id } });
  if (!report) return Response.json({ error: "Not found" }, { status: 404 });
  const source = selectExplainDetailSource(
    JSON.parse(report.blocks) as Block[],
    JSON.parse(report.findings) as ExplainFinding[],
    body.blockId,
  );
  if (!source) {
    return Response.json({ error: "Section not found" }, { status: 404 });
  }

  const routing = await loadAnalysisRouting();
  const { modelChain } = routing;
  const provider = getProvider(modelChain[0], access.apiKey, routing.providerRoutingByModel);
  const context = {
    feature: "explain" as const,
    resourceId: id,
    metadata: { action: "section_detail", blockId: body.blockId, modelChain },
  };
  const reservation = await reserveWebAnalysisCredits(access, {
    ...context,
    amount: maxCreditsForCalls(modelChain, 1),
  });
  if (isCreditResponse(reservation)) return reservation;
  const settle = createWebAnalysisUsageSettlement(access, reservation, context);
  const usages: OpenRouterUsage[] = [];
  const completedModels: string[] = [];
  const signal = AbortSignal.any([req.signal, AbortSignal.timeout(100_000)]);

  try {
    const result = await withModelFallbackPromise(
      modelChain,
      (model) => provider.explainDetail(
        {
          title: report.title,
          overview: report.overview ?? "",
          explanation: source.finding.explanation,
          blocks: source.blocks,
          // The stored audience is authoritative; the browser cannot silently
          // promote a simpler explanation to a higher academic level.
          level: normalizeLevel(report.level),
          lang: normalizeAppLanguage(body.lang ?? report.language),
        },
        { model, signal, onUsage: (usage) => usages.push(usage) },
      ),
      signal,
      (model) => completedModels.push(model),
    );
    return Response.json(result);
  } catch {
    return Response.json(
      { error: "Could not expand this section", code: "explain_detail_failed" },
      { status: 502 },
    );
  } finally {
    await settle({ usages, fallbackModels: completedModels });
  }
}
