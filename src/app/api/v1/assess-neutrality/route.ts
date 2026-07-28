import { NextRequest } from "next/server";
import { requireApiKey } from "@/lib/api/auth";
import { consume, rateLimitResponse } from "@/lib/rate-limit";
import { loadSettings, bucketFor } from "@/lib/settings";
import { jsonError, mapRunError, normalizeLang, readText } from "@/lib/api/http";
import { runNeutrality } from "@/lib/api/run";
import { mapNeutrality } from "@/lib/api/map";
import {
  createApiCreditMeter,
  isApiCreditResponse,
} from "@/lib/api/credit-billing";
import { maxCreditsForCalls } from "@/lib/jiddu-credit-rates";
import { DEFAULT_MODEL_CHAIN } from "@/lib/llm/fallback";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const auth = await requireApiKey(req);
  if (auth instanceof Response) return auth;

  const settings = await loadSettings();
  const rl = consume(`v1:neutrality:${auth.id}`, bucketFor(settings, "rate.api", auth));
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

  const body = (await req.json().catch(() => null)) as { lang?: unknown } | null;
  const text = readText(body);
  if (text instanceof Response) return text;
  const lang = normalizeLang(body?.lang);
  const meter = await createApiCreditMeter(auth, {
    amount: maxCreditsForCalls(DEFAULT_MODEL_CHAIN, 1),
    feature: "neutrality",
    metadata: { apiKeyId: auth.id },
  });
  if (isApiCreditResponse(meter)) return meter;

  try {
    const agg = await runNeutrality(text, {
      lang,
      signal: req.signal,
      apiKey: auth.apiKey,
      onModelUsed: meter.recordModel,
      onUsage: meter.recordUsage,
    });
    await meter.settle();
    return Response.json(mapNeutrality(agg));
  } catch (err) {
    await meter.settle({ note: "REST neutrality analysis failed." });
    return mapRunError(err);
  }
}

export function GET() {
  return jsonError("Use POST with { text } and an X-Jiddu-Key header", 405, "method_not_allowed");
}
