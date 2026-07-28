import { NextRequest } from "next/server";
import {
  isAccessResponse,
  requireWebAnalysisAccess,
} from "@/lib/web-analysis-access";
import {
  releaseJidduCreditReservation,
  settleJidduCreditReservation,
} from "@/lib/jiddu-credits";
import {
  isCreditResponse,
  reserveWebAnalysisCredits,
} from "@/lib/web-credit-billing";
import { loadSettings } from "@/lib/settings";

export const runtime = "nodejs";

const OPENAI_REALTIME_CLIENT_SECRETS =
  "https://api.openai.com/v1/realtime/client_secrets";
const OPENAI_LIVE_TRANSCRIPTION_MODEL = "gpt-live-transcribe";
const DEFAULT_TRANSCRIPTION_DELAY = "medium";
const TRANSCRIPTION_LANGUAGES = ["en", "pt", "es"] as const;

type TranscriptionDelay = "minimal" | "low" | "medium" | "high" | "xhigh";

type Body = {
  language?: string;
};

export async function POST(req: NextRequest) {
  const access = await requireWebAnalysisAccess();
  if (isAccessResponse(access)) return access;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json({ error: "OPENAI_API_KEY is not set" }, 500);
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const language = normalizeLang(body.language);
  const transcriptionDelay = normalizeDelay(
    process.env.OPENAI_LIVE_TRANSCRIBE_DELAY,
  );
  const settings = await loadSettings();
  const transcriptionCredits = Math.max(
    1,
    Math.ceil(settings["credits.liveTranscription"]),
  );
  const reservation = await reserveWebAnalysisCredits(access, {
    amount: transcriptionCredits,
    feature: "live_transcription",
    metadata: {
      language: language ?? null,
      delay: transcriptionDelay,
    },
  });
  if (isCreditResponse(reservation)) return reservation;

  // Coarse identifier for OpenAI's safety/rate-limit bucketing. Hashes the
  // client IP so we don't ship raw PII to OpenAI's logs.
  const safetyId = await hashIp(
    req.headers.get("x-forwarded-for") ??
      req.headers.get("x-real-ip") ??
      "anon",
  );

  // Keep turn detection client-controlled so Jiddu receives low-latency
  // transcript deltas continuously. All supported languages are hints rather
  // than hard restrictions, so multilingual speech and code-switching remain
  // available regardless of the current interface locale.
  const sessionConfig: Record<string, unknown> = {
    type: "transcription",
    audio: {
      input: {
        format: { type: "audio/pcm", rate: 24000 },
        transcription: {
          model: OPENAI_LIVE_TRANSCRIPTION_MODEL,
          delay: transcriptionDelay,
          languages: [...TRANSCRIPTION_LANGUAGES],
        },
        turn_detection: null,
      },
    },
  };

  let upstream: Response;
  try {
    upstream = await fetch(OPENAI_REALTIME_CLIENT_SECRETS, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Safety-Identifier": safetyId,
      },
      body: JSON.stringify({ session: sessionConfig }),
    });
  } catch (error) {
    await releaseJidduCreditReservation(reservation);
    throw error;
  }

  if (!upstream.ok) {
    await releaseJidduCreditReservation(reservation);
    const text = await upstream.text();
    console.error("[live/token] OpenAI error", upstream.status, text);
    return json(
      { error: `OpenAI returned ${upstream.status}`, detail: text.slice(0, 500) },
      502,
    );
  }

  const data = (await upstream.json()) as { value?: string; expires_at?: number };
  if (!data.value) {
    await releaseJidduCreditReservation(reservation);
    return json({ error: "Missing client_secret in OpenAI response" }, 502);
  }
  await settleJidduCreditReservation(
    reservation,
    transcriptionCredits,
    {
      metadata: {
        model: OPENAI_LIVE_TRANSCRIPTION_MODEL,
        delay: transcriptionDelay,
      },
    },
  );

  return json({
    clientSecret: data.value,
    expiresAt: data.expires_at ?? null,
    model: OPENAI_LIVE_TRANSCRIPTION_MODEL,
  });
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function normalizeLang(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.toLowerCase().trim();
  if (s === "en" || s === "pt" || s === "es") return s;
  return undefined;
}

function normalizeDelay(v: unknown): TranscriptionDelay {
  if (
    v === "minimal" ||
    v === "low" ||
    v === "medium" ||
    v === "high" ||
    v === "xhigh"
  ) {
    return v;
  }
  return DEFAULT_TRANSCRIPTION_DELAY;
}

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(`jiddu-live:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes.slice(0, 12))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
