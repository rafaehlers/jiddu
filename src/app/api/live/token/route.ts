import { NextRequest } from "next/server";

export const runtime = "nodejs";

const OPENAI_REALTIME_CLIENT_SECRETS =
  "https://api.openai.com/v1/realtime/client_secrets";

type Body = {
  language?: string;
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json({ error: "OPENAI_API_KEY is not set" }, 500);
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const language = normalizeLang(body.language);

  // Coarse identifier for OpenAI's safety/rate-limit bucketing. Hashes the
  // client IP so we don't ship raw PII to OpenAI's logs.
  const safetyId = await hashIp(
    req.headers.get("x-forwarded-for") ??
      req.headers.get("x-real-ip") ??
      "anon",
  );

  // gpt-realtime-whisper does NOT support server VAD / turn detection on
  // transcription sessions — set it to null and let the model emit
  // continuous deltas + completed events on its own cadence.
  const sessionConfig: Record<string, unknown> = {
    type: "transcription",
    audio: {
      input: {
        format: { type: "audio/pcm", rate: 24000 },
        transcription: {
          model: "gpt-realtime-whisper",
          ...(language ? { language } : {}),
        },
        turn_detection: null,
      },
    },
  };

  const upstream = await fetch(OPENAI_REALTIME_CLIENT_SECRETS, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Safety-Identifier": safetyId,
    },
    body: JSON.stringify({ session: sessionConfig }),
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    console.error("[live/token] OpenAI error", upstream.status, text);
    return json(
      { error: `OpenAI returned ${upstream.status}`, detail: text.slice(0, 500) },
      502,
    );
  }

  const data = (await upstream.json()) as { value?: string; expires_at?: number };
  if (!data.value) {
    return json({ error: "Missing client_secret in OpenAI response" }, 502);
  }

  return json({
    clientSecret: data.value,
    expiresAt: data.expires_at ?? null,
    model: "gpt-realtime-whisper",
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

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(`jiddu-live:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes.slice(0, 12))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
