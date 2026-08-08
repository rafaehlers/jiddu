import { withAuth } from "@workos-inc/authkit-nextjs";
import { NextRequest } from "next/server";
import { acquireConcurrency } from "@/lib/concurrency-limit";
import {
  recordIncludedJidduCreditUsage,
  releaseJidduCreditReservation,
  settleJidduCreditReservation,
} from "@/lib/jiddu-credits";
import { calculateLiveDiarizationSettlement } from "@/lib/live-diarization-billing";
import {
  createSavedDiarization,
  isSupportedDiarizationAudio,
  MAX_DIARIZATION_AUDIO_BYTES,
  sanitizeDiarizationResult,
} from "@/lib/live/diarization";
import { LIVE_DIARIZATION_MODEL } from "@/lib/model-ids";
import { prisma } from "@/lib/db";
import { consume, rateLimitResponse } from "@/lib/rate-limit";
import { bucketFromSettings, loadSettings } from "@/lib/settings";
import {
  isCreditResponse,
  reserveWebAnalysisCredits,
} from "@/lib/web-credit-billing";
import {
  isAccessResponse,
  requireWebAnalysisAccess,
} from "@/lib/web-analysis-access";

export const runtime = "nodejs";
export const maxDuration = 300;

const OPENAI_TRANSCRIPTIONS_URL =
  "https://api.openai.com/v1/audio/transcriptions";
const MAX_MULTIPART_OVERHEAD_BYTES = 1_000_000;

export async function POST(req: NextRequest) {
  const access = await requireWebAnalysisAccess();
  if (isAccessResponse(access)) return access;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return jsonError(
      "Speaker identification is not configured on this deployment.",
      503,
      "diarization_unavailable",
    );
  }

  const declaredLength = Number(req.headers.get("content-length"));
  if (
    Number.isFinite(declaredLength) &&
    declaredLength >
      MAX_DIARIZATION_AUDIO_BYTES + MAX_MULTIPART_OVERHEAD_BYTES
  ) {
    return audioTooLargeResponse();
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError("Invalid audio upload.", 400, "invalid_audio_upload");
  }

  const audio = form.get("audio");
  if (!(audio instanceof File) || audio.size === 0) {
    return jsonError(
      "Missing non-empty 'audio' file.",
      400,
      "audio_required",
    );
  }
  if (audio.size > MAX_DIARIZATION_AUDIO_BYTES) {
    return audioTooLargeResponse();
  }
  if (!isSupportedDiarizationAudio(audio)) {
    return jsonError(
      "Unsupported audio format.",
      415,
      "unsupported_audio_format",
    );
  }

  const requestedDurationMs = normalizeRequestedDurationMs(
    form.get("durationMs"),
  );
  if (requestedDurationMs === null) {
    return jsonError(
      "Missing or invalid recording duration.",
      400,
      "invalid_audio_duration",
    );
  }
  const resourceId = normalizeResourceId(form.get("resourceId"));

  const settings = await loadSettings();
  const identity = access.userId ?? access.email ?? "unknown";
  const rate = consume(
    `live:diarize:${identity}`,
    bucketFromSettings(settings, "rate.liveToken"),
  );
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);

  const estimatedSettlement = calculateLiveDiarizationSettlement(
    requestedDurationMs / 1_000,
    {
      marginMultiplier: settings["credits.marginMultiplier"],
      usdPerCredit: settings["credits.usdPerCredit"],
      usdPerMinute: settings["credits.liveDiarizationUsdPerMinute"],
    },
  );
  const reservation = await reserveWebAnalysisCredits(access, {
    amount: estimatedSettlement.credits,
    feature: "live_diarization",
    resourceId: resourceId ?? undefined,
    metadata: {
      model: LIVE_DIARIZATION_MODEL,
      requestedDurationMs,
      usdPerMinute: estimatedSettlement.usdPerMinute,
      marginMultiplier: estimatedSettlement.marginMultiplier,
      usdPerCredit: estimatedSettlement.usdPerCredit,
    },
  });
  if (isCreditResponse(reservation)) return reservation;

  const permit = acquireConcurrency(`live:diarize:${identity}`, 1);
  if (!permit) {
    await releaseJidduCreditReservation(reservation);
    return rateLimitResponse(2);
  }

  const upstreamForm = new FormData();
  upstreamForm.set("file", audio, audio.name || "jiddu-session.webm");
  upstreamForm.set("model", LIVE_DIARIZATION_MODEL);
  upstreamForm.set("response_format", "diarized_json");
  upstreamForm.set("chunking_strategy", "auto");

  let upstream: Response;
  try {
    upstream = await fetch(OPENAI_TRANSCRIPTIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Safety-Identifier": await hashSafetyIdentifier(identity),
      },
      body: upstreamForm,
      signal: req.signal,
    });
  } catch (error) {
    console.error("[live/diarize] OpenAI request failed", error);
    await releaseJidduCreditReservation(reservation);
    return jsonError(
      "Speaker identification is temporarily unavailable.",
      502,
      "diarization_failed",
    );
  } finally {
    permit.release();
  }

  const payload = (await upstream.json().catch(() => null)) as unknown;
  if (!upstream.ok) {
    await releaseJidduCreditReservation(reservation);
    console.error(
      "[live/diarize] OpenAI error",
      upstream.status,
      safeUpstreamError(payload),
    );
    const status =
      upstream.status === 413 ? 413 : upstream.status === 429 ? 429 : 502;
    return jsonError(
      status === 413
        ? "The recording is too large for speaker identification."
        : "Speaker identification is temporarily unavailable.",
      status,
      status === 413
        ? "audio_too_large"
        : status === 429
          ? "rate_limited"
          : "diarization_failed",
      upstream.headers.get("retry-after"),
    );
  }

  const result = sanitizeDiarizationResult(payload);
  if (!result || result.duration === null) {
    await releaseJidduCreditReservation(reservation);
    return jsonError(
      "OpenAI returned an invalid speaker transcript.",
      502,
      "invalid_diarization_response",
    );
  }

  const settlement = calculateLiveDiarizationSettlement(result.duration, {
    marginMultiplier: settings["credits.marginMultiplier"],
    usdPerCredit: settings["credits.usdPerCredit"],
    usdPerMinute: settings["credits.liveDiarizationUsdPerMinute"],
  });
  const usageMetadata = {
    model: LIVE_DIARIZATION_MODEL,
    durationSeconds: settlement.durationSeconds,
    usdPerMinute: settlement.usdPerMinute,
    usageAccounting: {
      provider: settlement.provider,
      providerCostMicros: settlement.providerCostMicros,
      billedCostMicros: settlement.billedCostMicros,
      marginMultiplier: settlement.marginMultiplier,
      usdPerCredit: settlement.usdPerCredit,
      reservationEstimate: reservation?.amount ?? 0,
      reservationOverrunCredits: Math.max(
        0,
        settlement.credits - (reservation?.amount ?? 0),
      ),
    },
  };
  try {
    if (access.billing === "jiddu") {
      await settleJidduCreditReservation(reservation, settlement.credits, {
        resourceId: resourceId ?? undefined,
        note: "OpenAI Live speaker identification",
        metadata: usageMetadata,
        usage: settlement,
      });
    } else if (access.userId && access.email) {
      await recordIncludedJidduCreditUsage({
        workosUserId: access.userId,
        email: access.email,
        feature: "live_diarization",
        resourceId: resourceId ?? undefined,
        note: "Included OpenAI Live speaker identification",
        metadata: usageMetadata,
        usage: settlement,
      });
    }
  } catch (error) {
    console.error("[live/diarize] usage settlement failed", error);
    await releaseJidduCreditReservation(reservation);
  }

  return Response.json(result, {
    headers: { "cache-control": "no-store" },
  });
}

export async function PUT(req: NextRequest) {
  const { user } = await withAuth();
  if (!user) {
    return jsonError(
      "Sign in to save a speaker transcript.",
      401,
      "authentication_required",
    );
  }

  const body = (await req.json().catch(() => null)) as unknown;
  if (typeof body !== "object" || body === null) {
    return jsonError(
      "Invalid speaker transcript.",
      400,
      "invalid_diarization",
    );
  }
  const payload = body as Record<string, unknown>;
  const resourceId = normalizeResourceId(
    typeof payload.resourceId === "string" ? payload.resourceId : null,
  );
  const diarization = createSavedDiarization(
    payload.result,
    payload.speakerNames,
  );
  if (!resourceId || !diarization) {
    return jsonError(
      "Invalid speaker transcript.",
      400,
      "invalid_diarization",
    );
  }

  const diarizedAt = new Date();
  const updated = await prisma.analysis.updateMany({
    where: {
      id: resourceId,
      ownerWorkosUserId: user.id,
      source: "live",
    },
    data: {
      diarizedTranscript: JSON.stringify(diarization),
      diarizedAt,
    },
  });
  if (updated.count === 0) {
    return jsonError("Live session not found.", 404, "session_not_found");
  }

  return Response.json(
    { savedAt: diarizedAt.toISOString() },
    { headers: { "cache-control": "no-store" } },
  );
}

function normalizeRequestedDurationMs(value: FormDataEntryValue | null) {
  const parsed = typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 61 * 60 * 1_000) {
    return null;
  }
  // The one-second UI clock can trigger the stop a fraction after the hard
  // cap. Reserve against no more than the supported 60-minute session.
  return Math.min(Math.floor(parsed), 60 * 60 * 1_000);
}

function normalizeResourceId(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().slice(0, 100);
  return normalized || null;
}

function audioTooLargeResponse(): Response {
  return jsonError(
    "The recording exceeds OpenAI's 25 MB transcription limit.",
    413,
    "audio_too_large",
  );
}

function jsonError(
  error: string,
  status: number,
  code: string,
  retryAfter: string | null = null,
): Response {
  return Response.json(
    { error, code },
    {
      status,
      headers: {
        "cache-control": "no-store",
        ...(retryAfter ? { "retry-after": retryAfter } : {}),
      },
    },
  );
}

async function hashSafetyIdentifier(identity: string): Promise<string> {
  const data = new TextEncoder().encode(`jiddu-live-diarize:${identity}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest).slice(0, 12))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function safeUpstreamError(payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "object" &&
    payload.error !== null &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message.slice(0, 500);
  }
  return "Unknown upstream error";
}
