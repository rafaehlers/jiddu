import { NextRequest } from "next/server";
import {
  isAccessResponse,
  requireWebAnalysisAccess,
} from "@/lib/web-analysis-access";
import { settleLiveTranscriptionReservation } from "@/lib/jiddu-credits";
import { normalizeLiveDurationMs } from "@/lib/live-billing";

export const runtime = "nodejs";

type Body = {
  reservationId?: string;
  durationMs?: number;
  resourceId?: string;
};

export async function POST(req: NextRequest) {
  const access = await requireWebAnalysisAccess();
  if (isAccessResponse(access)) return access;

  const body = (await req.json().catch(() => null)) as Body | null;
  const reservationId =
    typeof body?.reservationId === "string"
      ? body.reservationId.trim()
      : "";
  if (!reservationId) {
    return Response.json(
      { error: "Missing Live billing reservation." },
      { status: 400 },
    );
  }
  if (access.billing !== "jiddu" || !access.userId) {
    return Response.json({ settled: false, credits: 0 });
  }

  const result = await settleLiveTranscriptionReservation({
    reservationId,
    workosUserId: access.userId,
    durationMs: normalizeLiveDurationMs(body?.durationMs),
    resourceId:
      typeof body?.resourceId === "string" && body.resourceId.trim()
        ? body.resourceId.trim()
        : undefined,
  });
  if (!result) {
    return Response.json(
      { error: "Live billing reservation not found." },
      { status: 404 },
    );
  }

  return Response.json({
    settled: result.didSettle,
    credits: result.settlement.credits,
    durationMs: result.settlement.durationMs,
    providerCostMicros: result.settlement.providerCostMicros,
    billedCostMicros: result.settlement.billedCostMicros,
  });
}
