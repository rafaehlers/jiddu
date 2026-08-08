import { NextRequest } from "next/server";
import { requireApiKey } from "@/lib/api/auth";
import { consume, rateLimitResponse } from "@/lib/rate-limit";
import {
  loadSettings,
  loadStringSettings,
  bucketFor,
} from "@/lib/settings";
import {
  MAX_FACT_CHECK_TEXT_CHARS,
  jsonError,
  mapRunError,
  normalizeLang,
  readText,
} from "@/lib/api/http";
import { runFactCheck } from "@/lib/api/run";
import { mapFactCheck } from "@/lib/api/map";
import { startApiAnalysisHistory } from "@/lib/api/analysis-history";
import {
  createApiCreditMeter,
  isApiCreditResponse,
} from "@/lib/api/credit-billing";
import {
  maxCreditsForCalls,
  modelCreditRate,
} from "@/lib/jiddu-credit-rates";
import { DEFAULT_MODEL_CHAIN } from "@/lib/llm/fallback";

export const runtime = "nodejs";
// Fact-check extracts claims AND verifies each via Perplexity Sonar (web
// search), so it needs more headroom than the four fast text pipelines.
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const auth = await requireApiKey(req);
  if (auth instanceof Response) return auth;

  const [settings, stringSettings] = await Promise.all([
    loadSettings(),
    loadStringSettings(),
  ]);
  const verifyModel = stringSettings["factcheck.fastModel"];
  // Tighter, dedicated bucket — each claim is a paid Sonar call.
  const rl = consume(`v1:factcheck:${auth.id}`, bucketFor(settings, "rate.apiFactcheck", auth));
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

  const body = (await req.json().catch(() => null)) as { lang?: unknown } | null;
  const text = readText(body, MAX_FACT_CHECK_TEXT_CHARS);
  if (text instanceof Response) return text;
  const lang = normalizeLang(body?.lang);
  const maxClaims = Math.max(1, Math.floor(settings["api.maxClaims"]));
  const meter = await createApiCreditMeter(auth, {
    amount:
      maxCreditsForCalls(DEFAULT_MODEL_CHAIN, 1) +
      maxClaims * modelCreditRate(verifyModel),
    feature: "factcheck_api",
    metadata: { apiKeyId: auth.id, maxClaims },
  });
  if (isApiCreditResponse(meter)) return meter;

  const history = await startApiAnalysisHistory({
    kind: "factcheck",
    ownerWorkosUserId: auth.userId,
    transport: "API",
    sourceLabel: auth.label,
    text,
    lang,
    verifyModel,
  });

  try {
    const agg = await runFactCheck(text, {
      lang,
      maxClaims,
      signal: req.signal,
      apiKey: auth.apiKey,
      factCheckModel: verifyModel,
      onModelUsed(model) {
        meter.recordModel(model);
        history.recordModel(model);
      },
      onUsage: meter.recordUsage,
      onVerificationUsed: meter.recordVerification,
    });
    await history.complete(agg);
    await meter.settle({
      resourceId: history.id,
      metadata: {
        claimCount: agg.claims.length,
        verificationCount: agg.verdicts.length,
      },
    });
    return Response.json(mapFactCheck(agg));
  } catch (err) {
    await Promise.allSettled([
      history.fail(err),
      meter.settle({
        resourceId: history.id,
        note: "REST fact-check failed.",
      }),
    ]);
    return mapRunError(err);
  }
}

export function GET() {
  return jsonError("Use POST with { text } and an X-Jiddu-Key header", 405, "method_not_allowed");
}
