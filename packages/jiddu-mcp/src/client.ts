// Thin HTTP client for the Jiddu public REST API. The MCP server is a wrapper
// over the deployed API — it imports no Jiddu internals. The API key and base
// URL come from the environment (operator-configured), never from tool inputs,
// so the secret stays out of the model's context.

const BASE = (process.env.JIDDU_API_URL ?? "https://jiddu.app").replace(/\/$/, "");
const KEY = process.env.JIDDU_API_KEY ?? "";

export type CallBody = { text: string; lang?: string; level?: string };

export async function call(endpoint: string, body: CallBody): Promise<unknown> {
  if (!KEY) {
    throw new Error(
      "JIDDU_API_KEY is not set. Add it to the MCP server's env (see the install snippet in the README).",
    );
  }
  const res = await fetch(`${BASE}/api/v1/${endpoint}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-jiddu-key": KEY },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(290_000),
  });

  if (res.status === 429) {
    const data = (await res.json().catch(() => null)) as { retry_after_seconds?: number } | null;
    const retry = data?.retry_after_seconds;
    throw new Error(
      `Rate limited by the Jiddu API${retry ? ` — retry in ${retry}s` : ""}.`,
    );
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(`Jiddu API ${res.status}: ${data?.error ?? res.statusText}`);
  }
  return res.json();
}
