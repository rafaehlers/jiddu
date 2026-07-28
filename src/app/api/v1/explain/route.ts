import { NextRequest } from "next/server";
import { requireApiKey } from "@/lib/api/auth";
import { consume, rateLimitResponse } from "@/lib/rate-limit";
import { loadSettings, bucketFor } from "@/lib/settings";
import { jsonError, mapRunError, normalizeLang, readText } from "@/lib/api/http";
import { runExplain } from "@/lib/api/run";
import { mapExplain } from "@/lib/api/map";
import { normalizeLevel } from "@/lib/explain-schema";
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
  const rl = consume(`v1:explain:${auth.id}`, bucketFor(settings, "rate.api", auth));
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

  const body = (await req.json().catch(() => null)) as
    | { lang?: unknown; level?: unknown }
    | null;
  const text = readText(body);
  if (text instanceof Response) return text;
  const lang = normalizeLang(body?.lang);
  const level = normalizeLevel(body?.level);
  const meter = await createApiCreditMeter(auth, {
    amount: maxCreditsForCalls(DEFAULT_MODEL_CHAIN, 1),
    feature: "explain",
    metadata: { apiKeyId: auth.id, level },
  });
  if (isApiCreditResponse(meter)) return meter;

  try {
    const agg = await runExplain(text, {
      lang,
      level,
      signal: req.signal,
      apiKey: auth.apiKey,
      onModelUsed: meter.recordModel,
      onUsage: meter.recordUsage,
    });
    await meter.settle();
    return Response.json(mapExplain(agg, level));
  } catch (err) {
    await meter.settle({ note: "REST explanation failed." });
    return mapRunError(err);
  }
}

export function GET() {
  return jsonError("Use POST with { text, level? } and an X-Jiddu-Key header", 405, "method_not_allowed");
}
