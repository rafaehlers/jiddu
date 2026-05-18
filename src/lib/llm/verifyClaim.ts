import OpenAI from "openai";
import {
  CONFIDENCE_FLOOR,
  VerdictPayloadSchema,
  VerdictSourceSchema,
  applyConfidenceFloor,
  type Verdict,
  type VerdictSource,
} from "../verdict-schema";
import {
  buildVerifySystemPrompt,
  buildVerifyUserPrompt,
} from "../verify-claim-prompt";
import type { Claim } from "../claims-schema";
import type { Lang } from "../fallacies";
import {
  claimCacheKey,
  getCachedVerdict,
  putCachedVerdict,
} from "../factcheck/cache";

// Sonar variant used for verification. Reasoning Pro: built-in web search,
// returns citations via message.annotations, ~$0.005 per search request.
// Not exposed in the user-facing model dropdown.
export const VERIFY_MODEL = "perplexity/sonar-reasoning-pro";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const REFERER = process.env.OPENROUTER_REFERER || "https://jiddu.app";

let cachedClient: OpenAI | null = null;
function getClient(): OpenAI {
  if (cachedClient) return cachedClient;
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set in the environment");
  }
  cachedClient = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: OPENROUTER_BASE,
    defaultHeaders: {
      "HTTP-Referer": REFERER,
      "X-Title": "Jiddu",
    },
  });
  return cachedClient;
}

type ClaimWithId = Claim & { id: string };

// Extracted-payload type that includes the raw fields plus the channel
// annotations Perplexity sends back so we can surface URLs to the user.
type RawMessage = {
  content?: string | null;
  annotations?: Array<{
    type?: string;
    url_citation?: { url?: string; title?: string };
  }>;
};

export async function verifyClaim(
  claim: ClaimWithId,
  opts: { lang: Lang; signal?: AbortSignal; force?: boolean },
): Promise<Verdict & { cached: boolean }> {
  // Cache lookup first. Hash is keyed on language so identical statements
  // in different languages don't collide. When `force` is set we skip the
  // read but still write the fresh result back so subsequent calls hit.
  const hash = claimCacheKey(claim.statement, opts.lang);
  if (!opts.force) {
    const cached = await getCachedVerdict(hash);
    if (cached) {
      return {
        ...cached,
        claimId: claim.id,
        cached: true,
      };
    }
  }

  const client = getClient();
  const res = await client.chat.completions.create(
    {
      model: VERIFY_MODEL,
      messages: [
        { role: "system", content: buildVerifySystemPrompt(opts.lang) },
        { role: "user", content: buildVerifyUserPrompt(claim.statement, claim.type) },
      ],
    },
    opts.signal ? { signal: opts.signal } : undefined,
  );

  const choice = res.choices?.[0];
  const message = (choice?.message as unknown as RawMessage | undefined) ?? null;
  const content = message?.content?.trim() ?? "";
  if (!content) {
    throw new Error("Sonar returned an empty content body");
  }

  const json = extractJsonObject(content);
  const parsed = VerdictPayloadSchema.parse(json);

  // Sources from message.annotations[].url_citation. Deduplicate by URL and
  // drop anything that fails URL parsing.
  const seen = new Set<string>();
  const sources: VerdictSource[] = [];
  for (const a of message?.annotations ?? []) {
    const u = a.url_citation?.url;
    if (!u || seen.has(u)) continue;
    const candidate = {
      url: u,
      title: a.url_citation?.title ?? null,
    };
    const result = VerdictSourceSchema.safeParse(candidate);
    if (!result.success) continue;
    seen.add(u);
    sources.push(result.data);
  }

  const normalized = applyConfidenceFloor({
    claimId: claim.id,
    verdict: parsed.verdict,
    confidence: parsed.confidence,
    rationale: parsed.rationale,
  });

  const verdict: Verdict = {
    ...normalized,
    sources,
    model: VERIFY_MODEL,
  };

  // Cache the result. Failures are non-fatal — we'd rather return a fresh
  // verdict than fail the request on a write error.
  putCachedVerdict(hash, claim, verdict, opts.lang).catch((err) => {
    console.warn(
      `[verifyClaim] failed to cache verdict for claim ${claim.id}:`,
      err instanceof Error ? err.message : err,
    );
  });

  return { ...verdict, cached: false };
}

// Sonar usually returns clean JSON, but it sometimes wraps in markdown
// fences or prepends a short preamble. Walk to the first `{` and pair
// the last `}` so we tolerate either.
function extractJsonObject(text: string): unknown {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last < first) {
    throw new Error("Sonar response did not contain a JSON object");
  }
  const slice = text.slice(first, last + 1);
  return JSON.parse(slice);
}

export { CONFIDENCE_FLOOR };
