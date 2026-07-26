import OpenAI from "openai";
import type { ZodType } from "zod";
import type { Lang } from "../fallacies";
import {
  PaperLedgerSchema,
  PaperReviewResultSchema,
  type PaperLedger,
  type PaperResearch,
  type PaperReviewResult,
  type ReviewSource,
} from "../paper-review-schema";
import type { ResolvedVenueProfile } from "../venues";
import {
  buildInitialReviewPrompt,
  buildLedgerPrompt,
  buildResearchPrompt,
  buildSelfCritiquePrompt,
  paperReviewContract,
} from "../paper-review-prompt";
import { resolveModel } from "./openrouter";
import {
  PAPER_LEDGER_JSON_SCHEMA,
  PAPER_REVIEW_JSON_SCHEMA,
} from "./paperReviewJsonSchema";
import { DEFAULT_MODEL_CHAIN } from "./fallback";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const REFERER = process.env.OPENROUTER_REFERER || "https://jiddu.app";

type VisualPage = {
  pageNumber: number;
  png: Buffer;
};

type RunOptions = {
  modelId?: string;
  lang: Lang;
  signal?: AbortSignal;
};

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

export async function buildPaperLedger(
  paper: string,
  visualPages: VisualPage[],
  opts: RunOptions,
): Promise<{ ledger: PaperLedger; model: string }> {
  const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    { type: "text", text: buildLedgerPrompt(paper) },
    ...visualPages.flatMap(
      (page): OpenAI.Chat.Completions.ChatCompletionContentPart[] => [
        {
          type: "text",
          text: `Visual rendering of manuscript page ${page.pageNumber}:`,
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/png;base64,${page.png.toString("base64")}`,
            detail: "high",
          },
        },
      ],
    ),
  ];
  return runStructuredWithFallback(
    paperReviewContract(opts.lang),
    userContent,
    PAPER_LEDGER_JSON_SCHEMA,
    PaperLedgerSchema,
    opts,
  ).then(({ value, model }) => ({ ledger: value, model }));
}

export async function researchPaperNovelty(
  ledger: PaperLedger,
  venueProfile: ResolvedVenueProfile,
  opts: RunOptions,
): Promise<PaperResearch> {
  const client = getClient();
  const errors: string[] = [];

  for (const modelId of modelChain(opts.modelId)) {
    const choice = resolveModel(modelId);
    try {
      const response = await client.chat.completions.create(
        {
          model: choice.openrouter,
          messages: [
            { role: "system", content: paperReviewContract(opts.lang) },
            {
              role: "user",
              content: buildResearchPrompt(ledger, venueProfile),
            },
          ],
          tools: [
            {
              type: "openrouter:web_search",
              parameters: {
                engine: "auto",
                max_results: 6,
                max_total_results: 20,
                max_uses: 4,
                search_context_size: "medium",
                excluded_domains: [
                  "reddit.com",
                  "medium.com",
                  "substack.com",
                  "researchgate.net",
                ],
              },
            },
          ],
          max_tool_calls: 5,
          ...providerExtras(choice),
        } as unknown as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
        opts.signal ? { signal: opts.signal } : undefined,
      );
      const message = response.choices[0]?.message as
        | (OpenAI.Chat.Completions.ChatCompletionMessage & {
            annotations?: Array<{
              type?: string;
              url_citation?: { url?: string; title?: string };
            }>;
          })
        | undefined;
      const synthesis =
        typeof message?.content === "string" ? message.content.trim() : "";
      if (!synthesis) throw new Error("Research model returned no memo");
      return {
        synthesis,
        sources: sourcesFromAnnotations(message?.annotations ?? []),
      };
    } catch (err) {
      if (opts.signal?.aborted) throw err;
      errors.push(
        `${modelId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  throw new Error(`Literature research failed: ${errors.join(" / ")}`);
}

export async function buildInitialPaperReview(
  args: {
    paper: string;
    ledger: PaperLedger;
    research: PaperResearch;
    venueProfile: ResolvedVenueProfile;
    reviewDate: string;
  },
  opts: RunOptions,
): Promise<{ review: PaperReviewResult; model: string }> {
  return runStructuredWithFallback(
    paperReviewContract(opts.lang),
    buildInitialReviewPrompt(args),
    PAPER_REVIEW_JSON_SCHEMA,
    PaperReviewResultSchema,
    opts,
  ).then(({ value, model }) => ({
    review: mergeResearchSources(value, args.research.sources),
    model,
  }));
}

export async function selfCritiquePaperReview(
  args: {
    paper: string;
    ledger: PaperLedger;
    research: PaperResearch;
    initialReview: PaperReviewResult;
    venueProfile: ResolvedVenueProfile;
    reviewDate: string;
  },
  opts: RunOptions,
): Promise<{ review: PaperReviewResult; model: string }> {
  return runStructuredWithFallback(
    paperReviewContract(opts.lang),
    buildSelfCritiquePrompt(args),
    PAPER_REVIEW_JSON_SCHEMA,
    PaperReviewResultSchema,
    opts,
  ).then(({ value, model }) => ({
    review: mergeResearchSources(value, args.research.sources),
    model,
  }));
}

async function runStructuredWithFallback<T>(
  system: string,
  userContent:
    | string
    | OpenAI.Chat.Completions.ChatCompletionContentPart[],
  schema: Record<string, unknown>,
  validator: ZodType<T>,
  opts: RunOptions,
): Promise<{ value: T; model: string }> {
  const client = getClient();
  const errors: string[] = [];

  for (const modelId of modelChain(opts.modelId)) {
    const choice = resolveModel(modelId);
    try {
      const response = await client.chat.completions.create(
        {
          model: choice.openrouter,
          messages: [
            { role: "system", content: system },
            { role: "user", content: userContent },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "report_analysis",
                description: "Return the complete structured analysis.",
                parameters: schema,
              },
            },
          ],
          tool_choice:
            choice.toolMode === "auto"
              ? "auto"
              : {
                  type: "function",
                  function: { name: "report_analysis" },
                },
          ...providerExtras(choice),
        } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
        opts.signal ? { signal: opts.signal } : undefined,
      );
      const toolCall = response.choices[0]?.message?.tool_calls?.find(
        (call) =>
          call.type === "function" &&
          call.function.name === "report_analysis",
      );
      if (!toolCall || toolCall.type !== "function") {
        throw new Error("Model response missing report_analysis tool call");
      }
      return {
        value: validator.parse(JSON.parse(toolCall.function.arguments)),
        model: choice.id,
      };
    } catch (err) {
      if (opts.signal?.aborted) throw err;
      errors.push(
        `${modelId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  throw new Error(`Structured review stage failed: ${errors.join(" / ")}`);
}

function modelChain(selected?: string): string[] {
  return Array.from(
    new Set([
      resolveModel(selected).id,
      ...DEFAULT_MODEL_CHAIN,
    ]),
  );
}

function providerExtras(
  choice: ReturnType<typeof resolveModel>,
): Record<string, unknown> {
  return choice.providerOrder
    ? {
        provider: {
          order: choice.providerOrder,
          allow_fallbacks: false,
        },
      }
    : {};
}

function sourcesFromAnnotations(
  annotations: Array<{
    type?: string;
    url_citation?: { url?: string; title?: string };
  }>,
): ReviewSource[] {
  const seen = new Set<string>();
  const sources: ReviewSource[] = [];
  for (const annotation of annotations) {
    const url = annotation.url_citation?.url;
    if (!url || seen.has(url)) continue;
    try {
      new URL(url);
    } catch {
      continue;
    }
    seen.add(url);
    sources.push({
      url,
      title: annotation.url_citation?.title ?? null,
    });
  }
  return sources;
}

function mergeResearchSources(
  review: PaperReviewResult,
  researchSources: ReviewSource[],
): PaperReviewResult {
  const byUrl = new Map<string, ReviewSource>();
  for (const source of [...review.sources, ...researchSources]) {
    byUrl.set(source.url, source);
  }
  return { ...review, sources: Array.from(byUrl.values()) };
}
