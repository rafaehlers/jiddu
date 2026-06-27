import { NextRequest } from "next/server";
import { requireApiKey } from "@/lib/api/auth";
import { consume, rateLimitResponse } from "@/lib/rate-limit";
import { loadSettings, bucketFor } from "@/lib/settings";
import { jsonError, mapRunError, normalizeLang, readText } from "@/lib/api/http";
import { runExplain } from "@/lib/api/run";
import { mapExplain } from "@/lib/api/map";
import { normalizeLevel } from "@/lib/explain-schema";

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

  try {
    const agg = await runExplain(text, { lang, level, signal: req.signal });
    return Response.json(mapExplain(agg, level));
  } catch (err) {
    return mapRunError(err);
  }
}

export function GET() {
  return jsonError("Use POST with { text, level? } and an X-Jiddu-Key header", 405, "method_not_allowed");
}
