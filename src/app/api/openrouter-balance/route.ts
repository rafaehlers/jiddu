import { NextResponse } from "next/server";
import {
  getOpenRouterCredits,
  isCreditsSnapshot,
} from "@/lib/openrouter-credits";

// Public, unauthenticated: the site footer shows the operator's remaining
// OpenRouter balance as a transparency signal for this free tool. Only the
// `remaining` figure is exposed — never total_credits/total_usage.
//
// The heavy lifting (and a 5-minute in-memory cache) lives in
// getOpenRouterCredits(), so this route never calls OpenRouter more than
// once per 5 minutes per process. We also send Cache-Control so browsers /
// any CDN cache the response and don't re-hit us on every page view.
export const runtime = "nodejs";

export async function GET() {
  const credits = await getOpenRouterCredits();

  const remaining = isCreditsSnapshot(credits) ? credits.remaining : null;

  return NextResponse.json(
    { remaining },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    },
  );
}
