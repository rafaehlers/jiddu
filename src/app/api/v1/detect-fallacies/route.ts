import { NextRequest } from "next/server";
import { requireApiKey } from "@/lib/api/auth";
import { consume, rateLimitResponse } from "@/lib/rate-limit";
import { loadSettings, bucketFor } from "@/lib/settings";
import { jsonError, mapRunError, normalizeLang, readText } from "@/lib/api/http";
import { runFallacies } from "@/lib/api/run";
import { mapFallacies } from "@/lib/api/map";
import { startApiAnalysisHistory } from "@/lib/api/analysis-history";
import {
  createApiCreditMeter,
  isApiCreditResponse,
} from "@/lib/api/credit-billing";
import { maxCreditsForCalls } from "@/lib/jiddu-credit-rates";
import { loadAnalysisRouting } from "@/lib/analysis-routing";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const auth = await requireApiKey(req);
  if (auth instanceof Response) return auth;

  const [settings, analysisRouting] = await Promise.all([
    loadSettings(),
    loadAnalysisRouting(),
  ]);
  const rl = consume(`v1:fallacies:${auth.id}`, bucketFor(settings, "rate.api", auth));
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

  const body = (await req.json().catch(() => null)) as { lang?: unknown } | null;
  const text = readText(body);
  if (text instanceof Response) return text;
  const lang = normalizeLang(body?.lang);
  const meter = await createApiCreditMeter(auth, {
    amount: maxCreditsForCalls(analysisRouting.modelChain, 1),
    feature: "fallacy",
    metadata: { apiKeyId: auth.id },
  });
  if (isApiCreditResponse(meter)) return meter;

  const history = await startApiAnalysisHistory({
    kind: "fallacy",
    ownerWorkosUserId: auth.userId,
    transport: "API",
    sourceLabel: auth.label,
    text,
    lang,
  });

  try {
    const agg = await runFallacies(text, {
      lang,
      signal: req.signal,
      apiKey: auth.apiKey,
      analysisRouting,
      onModelUsed(model) {
        meter.recordModel(model);
        history.recordModel(model);
      },
      onUsage: meter.recordUsage,
    });
    await history.complete(agg);
    await meter.settle({ resourceId: history.id });
    return Response.json(mapFallacies(agg));
  } catch (err) {
    await Promise.allSettled([
      history.fail(err),
      meter.settle({
        resourceId: history.id,
        note: "REST fallacy analysis failed.",
      }),
    ]);
    return mapRunError(err);
  }
}

export function GET() {
  return jsonError("Use POST with { text } and an X-Jiddu-Key header", 405, "method_not_allowed");
}
