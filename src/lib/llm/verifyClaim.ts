import { z } from "zod";
import {
  CONFIDENCE_FLOOR,
  SOURCE_TIERS,
  VerdictPayloadSchema,
  VerdictSourceSchema,
  applyConfidenceFloor,
  type SourceTier,
  type Verdict,
  type VerdictSource,
} from "../verdict-schema";
import {
  buildVerifySystemPrompt,
  buildVerifyUserPrompt,
} from "../verify-claim-prompt";
import type { Claim } from "../claims-schema";
import type { Lang } from "../fallacies";
import { normalizeCapturedSourceUrl } from "../live-source-context";
import {
  claimCacheKey,
  getCachedVerdict,
  putCachedVerdict,
} from "../factcheck/cache";
import {
  readOpenRouterUsage,
  type OpenRouterUsage,
} from "../openrouter-usage";
import {
  getSonarClient,
  SONAR_MODEL,
  type SonarMessage,
} from "./sonar-client";

// Sonar variant used for verification. Reasoning Pro: built-in web search,
// returns citations via message.annotations, ~$0.005 per search request.
// Not exposed in the user-facing model dropdown.
export const VERIFY_MODEL = SONAR_MODEL;

type ClaimWithId = Claim & { id: string };

export async function verifyClaim(
  claim: ClaimWithId,
  opts: {
    lang: Lang;
    signal?: AbortSignal;
    force?: boolean;
    apiKey?: string;
    sourceUrl?: string | null;
    onUsage?: (usage: OpenRouterUsage) => void;
  },
): Promise<Verdict & { cached: boolean; usage?: OpenRouterUsage }> {
  // Cache lookup first. Hash is keyed on language so identical statements
  // in different languages don't collide. When `force` is set we skip the
  // read but still write the fresh result back so subsequent calls hit.
  const sourceUrl = normalizeCapturedSourceUrl(opts.sourceUrl);
  const hash = claimCacheKey(claim.statement, opts.lang, sourceUrl);
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

  const client = getSonarClient(opts.apiKey);
  const res = await client.chat.completions.create(
    {
      model: VERIFY_MODEL,
      messages: [
        { role: "system", content: buildVerifySystemPrompt(opts.lang) },
        {
          role: "user",
          content: buildVerifyUserPrompt(
            claim.statement,
            claim.type,
            sourceUrl,
          ),
        },
      ],
      // Sonar's provider default can reserve its full 65K output window.
      // Verdict JSON is compact; cap it so OpenRouter does not reject a
      // routine verification based on an unrealistic maximum-cost exposure.
      max_tokens: 4_000,
    },
    opts.signal ? { signal: opts.signal } : undefined,
  );
  const usage = readOpenRouterUsage(res, VERIFY_MODEL);
  if (usage) opts.onUsage?.(usage);

  const choice = res.choices?.[0];
  const message =
    (choice?.message as unknown as SonarMessage | undefined) ?? null;
  const content = message?.content?.trim() ?? "";
  if (!content) {
    throw new Error("Sonar returned an empty content body");
  }

  const json = extractJsonObject(content);
  const parsed = VerdictPayloadSchema.parse(json);
  const tierIndex = extractSourceTierIndex(json);

  // Sources from message.annotations[].url_citation, deduped by URL. Tier
  // / state-controlled flag come from the model's JSON (tierIndex). If the
  // model omits a URL or returns a malformed entry, the source still ships
  // — we just don't display a tier badge for it.
  const seen = new Set<string>();
  const sources: VerdictSource[] = [];
  for (const a of message?.annotations ?? []) {
    const u = a.url_citation?.url;
    if (!u || seen.has(u)) continue;
    const tierInfo = tierIndex.get(u);
    const candidate = {
      url: u,
      title: a.url_citation?.title ?? null,
      tier: tierInfo?.tier ?? null,
      stateControlled: tierInfo?.stateControlled ?? null,
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
  if (usage) usage.completed = true;

  // Cache the result. Failures are non-fatal — we'd rather return a fresh
  // verdict than fail the request on a write error.
  putCachedVerdict(hash, claim, verdict, opts.lang).catch((err) => {
    console.warn(
      `[verifyClaim] failed to cache verdict for claim ${claim.id}:`,
      err instanceof Error ? err.message : err,
    );
  });

  return {
    ...verdict,
    cached: false,
    ...(usage ? { usage } : {}),
  };
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

// Picks the optional sourceTiers[] array out of the model's JSON and
// turns it into a URL → { tier, stateControlled } lookup. We're lenient:
// if the field is missing or malformed, return an empty index and let the
// sources flow through without tiers.
const SourceTierItemSchema = z.object({
  url: z.string(),
  tier: z.string().optional().nullable(),
  stateControlled: z.boolean().optional().nullable(),
});

function extractSourceTierIndex(
  json: unknown,
): Map<string, { tier: SourceTier | null; stateControlled: boolean | null }> {
  const out = new Map<
    string,
    { tier: SourceTier | null; stateControlled: boolean | null }
  >();
  if (!json || typeof json !== "object") return out;
  const arr = (json as { sourceTiers?: unknown }).sourceTiers;
  if (!Array.isArray(arr)) return out;
  for (const raw of arr) {
    const parsed = SourceTierItemSchema.safeParse(raw);
    if (!parsed.success) continue;
    const t = parsed.data.tier?.toLowerCase().replace(/[\s-]+/g, "_");
    const tier =
      t && (SOURCE_TIERS as readonly string[]).includes(t)
        ? (t as SourceTier)
        : null;
    out.set(parsed.data.url, {
      tier,
      stateControlled: parsed.data.stateControlled ?? null,
    });
  }
  return out;
}

export { CONFIDENCE_FLOOR };
