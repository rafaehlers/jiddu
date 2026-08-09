import OpenAI from "openai";
import { nanoid } from "nanoid";
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
  QualityAuditSchema,
  SpecsStageResultSchema,
  type ComputationAuditItem,
  type QualityAudit,
  type SpecsCriterion,
  type SpecsStageResult,
} from "../paper-review-audit-schema";
import {
  buildFinalRepairPrompt,
  buildInitialReviewPrompt,
  buildLedgerPrompt,
  buildQualityAuditPrompt,
  buildResearchPrompt,
  buildSelfCritiquePrompt,
  buildSpecsStagePrompt,
  paperReviewContract,
} from "../paper-review-prompt";
import { resolvePaperReviewModel } from "./openrouter";
import {
  PAPER_LEDGER_JSON_SCHEMA,
  PAPER_REVIEW_JSON_SCHEMA,
  QUALITY_AUDIT_JSON_SCHEMA,
  SPECS_STAGE_JSON_SCHEMA,
} from "./paperReviewJsonSchema";
import { DEFAULT_MODEL_CHAIN } from "./fallback";
import {
  readOpenRouterUsage,
  type OpenRouterUsage,
} from "../openrouter-usage";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const REFERER = process.env.OPENROUTER_REFERER || "https://jiddu.app";

type VisualPage = {
  pageNumber: number;
  png: Buffer;
};

export type PaperReviewModelCallEvent =
  | {
      kind: "started";
      callId: string;
      operation: string;
      model: string;
      startedAt: string;
    }
  | {
      kind: "completed" | "failed";
      callId: string;
      operation: string;
      model: string;
      startedAt: string;
      finishedAt: string;
      durationMs: number;
      error?: string;
    };

type RunOptions = {
  modelId?: string;
  lang: Lang;
  operation?: string;
  signal?: AbortSignal;
  strictModel?: boolean;
  apiKey?: string;
  onUsage?: (usage: OpenRouterUsage) => void;
  onCallEvent?: (event: PaperReviewModelCallEvent) => void | Promise<void>;
};

let cachedClient: OpenAI | null = null;

function getClient(apiKey?: string): OpenAI {
  if (!apiKey && cachedClient) return cachedClient;
  const resolvedKey = apiKey ?? process.env.OPENROUTER_API_KEY;
  if (!resolvedKey) {
    throw new Error("OPENROUTER_API_KEY is not set in the environment");
  }
  const client = new OpenAI({
    apiKey: resolvedKey,
    baseURL: OPENROUTER_BASE,
    defaultHeaders: {
      "HTTP-Referer": REFERER,
      "X-Title": "Jiddu",
    },
  });
  if (!apiKey) cachedClient = client;
  return client;
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
  const client = getClient(opts.apiKey);
  const errors: string[] = [];

  for (const modelId of modelChain(opts.modelId, opts.strictModel)) {
    const choice = resolvePaperReviewModel(modelId);
    try {
      return await trackModelCall(choice.id, opts, async () => {
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
            max_tokens: 8_000,
            ...providerExtras(choice),
          } as unknown as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
          opts.signal ? { signal: opts.signal } : undefined,
        );
        const usage = readOpenRouterUsage(response, choice.id);
        if (usage) opts.onUsage?.(usage);
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
        if (usage) usage.completed = true;
        return {
          synthesis,
          sources: sourcesFromAnnotations(message?.annotations ?? []),
          model: choice.id,
        };
      });
    } catch (err) {
      if (opts.signal?.aborted) throw err;
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${modelId}: ${message}`);
      if (!opts.strictModel) {
        console.warn(
          `[paper-review] research model="${modelId}" failed; trying fallback: ${message}`,
        );
      }
    }
  }
  throw new Error(`Literature research failed: ${errors.join(" / ")}`);
}

export async function buildInitialPaperReview(
  args: {
    paper: string;
    ledger: PaperLedger;
    research: PaperResearch;
    specs: SpecsStageResult[];
    computations: ComputationAuditItem[];
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
    specs: SpecsStageResult[];
    computations: ComputationAuditItem[];
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

export async function runSpecsStage(
  args: {
    criterion: SpecsCriterion;
    paper: string;
    ledger: PaperLedger;
    research?: PaperResearch;
    venueProfile: ResolvedVenueProfile;
    visualPages: VisualPage[];
  },
  opts: RunOptions,
): Promise<{ stage: SpecsStageResult; model: string }> {
  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    { type: "text", text: buildSpecsStagePrompt(args) },
    ...args.visualPages.flatMap(
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
  const result = await runStructuredWithFallback(
    paperReviewContract(opts.lang),
    content,
    SPECS_STAGE_JSON_SCHEMA,
    SpecsStageResultSchema,
    opts,
  );
  if (result.value.criterion !== args.criterion) {
    throw new Error(
      `SPECS stage returned ${result.value.criterion} instead of ${args.criterion}`,
    );
  }
  return { stage: result.value, model: result.model };
}

export async function auditPaperReviewQuality(
  args: {
    review: PaperReviewResult;
    specs: SpecsStageResult[];
    computations: ComputationAuditItem[];
    sources: PaperReviewResult["sources"];
  },
  opts: RunOptions,
): Promise<{ quality: QualityAudit; model: string }> {
  return runStructuredWithFallback(
    paperReviewContract(opts.lang),
    buildQualityAuditPrompt(args),
    QUALITY_AUDIT_JSON_SCHEMA,
    QualityAuditSchema,
    opts,
  ).then(({ value, model }) => ({ quality: value, model }));
}

export async function repairPaperReview(
  args: {
    paper: string;
    ledger: PaperLedger;
    research: PaperResearch;
    specs: SpecsStageResult[];
    computations: ComputationAuditItem[];
    review: PaperReviewResult;
    quality: QualityAudit;
    missingFindingIds: string[];
    venueProfile: ResolvedVenueProfile;
    reviewDate: string;
  },
  opts: RunOptions,
): Promise<{ review: PaperReviewResult; model: string }> {
  return runStructuredWithFallback(
    paperReviewContract(opts.lang),
    buildFinalRepairPrompt(args),
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
  const client = getClient(opts.apiKey);
  const errors: string[] = [];

  for (const modelId of modelChain(opts.modelId, opts.strictModel)) {
    const choice = resolvePaperReviewModel(modelId);
    try {
      return await trackModelCall(choice.id, opts, async () => {
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
            max_tokens: 16_000,
            ...providerExtras(choice),
          } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
          opts.signal ? { signal: opts.signal } : undefined,
        );
        const usage = readOpenRouterUsage(response, choice.id);
        if (usage) opts.onUsage?.(usage);
        const toolCall = response.choices[0]?.message?.tool_calls?.find(
          (call) =>
            call.type === "function" &&
            call.function.name === "report_analysis",
        );
        if (!toolCall || toolCall.type !== "function") {
          throw new Error("Model response missing report_analysis tool call");
        }
        const value = validator.parse(JSON.parse(toolCall.function.arguments));
        if (usage) usage.completed = true;
        return {
          value,
          model: choice.id,
        };
      });
    } catch (err) {
      if (opts.signal?.aborted) throw err;
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${modelId}: ${message}`);
      if (!opts.strictModel) {
        console.warn(
          `[paper-review] structured model="${modelId}" failed; trying fallback: ${message}`,
        );
      }
    }
  }
  throw new Error(`Structured review stage failed: ${errors.join(" / ")}`);
}

function modelChain(selected?: string, strictModel = false): string[] {
  const resolved = resolvePaperReviewModel(selected).id;
  if (strictModel) return [resolved];
  return Array.from(
    new Set([
      resolved,
      ...DEFAULT_MODEL_CHAIN,
    ]),
  );
}

function providerExtras(
  choice: ReturnType<typeof resolvePaperReviewModel>,
): Record<string, unknown> {
  const provider = {
    ...(choice.providerOrder
      ? {
          order: choice.providerOrder,
          allow_fallbacks: false,
        }
      : {}),
    ...(choice.requireParameters ? { require_parameters: true } : {}),
  };
  return {
    ...(Object.keys(provider).length > 0 ? { provider } : {}),
    ...(choice.reasoningEffort
      ? { reasoning: { effort: choice.reasoningEffort } }
      : {}),
  };
}

async function trackModelCall<T>(
  model: string,
  opts: RunOptions,
  run: () => Promise<T>,
): Promise<T> {
  const callId = nanoid(10);
  const operation = opts.operation ?? "paper_review";
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  await emitCallEvent(opts, {
    kind: "started",
    callId,
    operation,
    model,
    startedAt,
  });

  try {
    const result = await run();
    const finished = Date.now();
    await emitCallEvent(opts, {
      kind: "completed",
      callId,
      operation,
      model,
      startedAt,
      finishedAt: new Date(finished).toISOString(),
      durationMs: Math.max(0, finished - started),
    });
    return result;
  } catch (error) {
    const finished = Date.now();
    await emitCallEvent(opts, {
      kind: "failed",
      callId,
      operation,
      model,
      startedAt,
      finishedAt: new Date(finished).toISOString(),
      durationMs: Math.max(0, finished - started),
      error: (error instanceof Error ? error.message : String(error)).slice(
        0,
        1_000,
      ),
    });
    throw error;
  }
}

async function emitCallEvent(
  opts: RunOptions,
  event: Parameters<NonNullable<RunOptions["onCallEvent"]>>[0],
) {
  try {
    await opts.onCallEvent?.(event);
  } catch (error) {
    console.warn(
      "[paper-review:call-telemetry]",
      error instanceof Error ? error.message : error,
    );
  }
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
