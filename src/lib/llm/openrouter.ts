import OpenAI from "openai";
import { parse as partialParse } from "partial-json";
import { AnalysisResultSchema, FindingSchema, type Finding } from "../schema";
import {
  ClaimExtractionResultSchema,
  ClaimSchema,
  type Claim,
} from "../claims-schema";
import { CLAIMS_JSON_SCHEMA } from "./claimsJsonSchema";
import {
  buildClaimsSystemPrompt,
  buildClaimsUserPrompt,
} from "../claims-prompt";
import {
  NeutralityFindingSchema,
  NeutralityResultSchema,
  type NeutralityFinding,
  type NeutralityResult,
} from "../neutrality-schema";
import { NEUTRALITY_JSON_SCHEMA } from "./neutralityJsonSchema";
import {
  buildNeutralitySystemPrompt,
  buildNeutralityUserPrompt,
} from "../neutrality-prompt";
import {
  ExplainFindingSchema,
  ExplainResultSchema,
  type ExplainFinding,
  type ExplainLevel,
  type ExplainResult,
} from "../explain-schema";
import { EXPLAIN_JSON_SCHEMA } from "./explainJsonSchema";
import {
  buildExplainSystemPrompt,
  buildExplainUserPrompt,
} from "../explain-prompt";
import { buildSystemPrompt, buildUserPrompt } from "../prompt";
import { ANALYSIS_JSON_SCHEMA } from "./jsonSchema";
import {
  SlopFindingSchema,
  SlopResultSchema,
  type SlopFinding,
} from "../slop-schema";
import { SLOP_JSON_SCHEMA } from "./slopJsonSchema";
import { buildSlopSystemPrompt, buildSlopUserPrompt } from "../slop-prompt";
import type { AnalyzeInput, AnalyzeOutput, LlmProvider, ProviderId } from "./types";
import type {
  ClaimStreamEvent,
  ExplainStreamEvent,
  NeutralityStreamEvent,
  SlopStreamEvent,
  StreamEvent,
} from "./stream";

// Curated catalog of OpenRouter models exposed in the UI dropdown. Each entry
// pairs a stable internal id (used as the value in DB + form) with the
// upstream OpenRouter slug.
export type ModelChoice = {
  id: string;
  label: string;
  // Country-of-origin emoji shown next to the model name in the UI. Used
  // as a quick signal that the user is choosing between e.g. a Western
  // and a Chinese model, which matters for political-content analysis
  // where the model's training bias can flow through.
  flag?: string;
  family:
    | ProviderId
    | "google"
    | "meta"
    | "mistral"
    | "deepseek"
    | "qwen"
    | "moonshot"
    | "zhipu"
    | "minimax";
  openrouter: string;
  // Most upstreams honour a forced tool_choice; Qwen rejects it and only
  // works with "auto". Default is forced.
  toolMode?: "forced" | "auto";
  // Pin OpenRouter's upstream routing. MiniMax is a reasoning model that
  // only emits tool_calls reliably when the upstream is "MiniMax" itself
  // (Morph/Fireworks burn budget on reasoning and never call the tool).
  providerOrder?: string[];
};

export const MODEL_CATALOG: ModelChoice[] = [
  {
    id: "gpt-5.4-mini",
    label: "GPT-5.4 mini",
    flag: "🇺🇸",
    family: "openai",
    openrouter: "openai/gpt-5.4-mini",
  },
  {
    id: "minimax-m2.7",
    label: "MiniMax M2.7",
    flag: "🇨🇳",
    family: "minimax",
    openrouter: "minimax/minimax-m2.7",
    // The Minimax upstream rejects forced tool_choice ("auto" only), and
    // pinning the provider stops OpenRouter from routing to Morph/Fireworks
    // (those burn the budget on reasoning and never emit the tool call).
    toolMode: "auto",
    providerOrder: ["Minimax"],
  },
];

const MODEL_BY_ID: Record<string, ModelChoice> = Object.fromEntries(
  MODEL_CATALOG.map((m) => [m.id, m]),
);

const DEFAULT_MODEL_ID = "gpt-5.4-mini";

export function resolveModel(id?: string | null): ModelChoice {
  if (id && MODEL_BY_ID[id]) return MODEL_BY_ID[id];
  return MODEL_BY_ID[DEFAULT_MODEL_ID];
}

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const REFERER = process.env.OPENROUTER_REFERER || "https://jiddu.app";

export class OpenRouterProvider implements LlmProvider {
  readonly id: ProviderId;
  readonly defaultModel: string;
  private client: OpenAI;
  private modelSlug: string;

  constructor(modelId?: string, apiKey?: string) {
    const choice = resolveModel(modelId);
    // The schema's `provider` field accepts "anthropic" | "openai"; map other
    // families to the closest neighbour so we don't break the DB column.
    this.id = (choice.family === "anthropic" ? "anthropic" : "openai") as ProviderId;
    this.defaultModel = choice.id;
    this.modelSlug = choice.openrouter;
    this.client = new OpenAI({
      apiKey: apiKey ?? process.env.OPENROUTER_API_KEY,
      baseURL: OPENROUTER_BASE,
      defaultHeaders: {
        "HTTP-Referer": REFERER,
        "X-Title": "Jiddu",
      },
    });
  }

  private slug(modelOverride?: string): string {
    if (modelOverride) {
      const c = resolveModel(modelOverride);
      return c.openrouter;
    }
    return this.modelSlug;
  }

  private toolChoiceFor(modelOverride?: string):
    | "auto"
    | { type: "function"; function: { name: string } } {
    const choice = resolveModel(modelOverride ?? this.defaultModel);
    if (choice.toolMode === "auto") return "auto";
    return { type: "function", function: { name: "report_analysis" } };
  }

  // OpenRouter-specific extras (provider routing). Not part of the OpenAI
  // schema, so we widen the type to pass them through as request body.
  private openRouterExtras(modelOverride?: string): Record<string, unknown> {
    const choice = resolveModel(modelOverride ?? this.defaultModel);
    if (choice.providerOrder && choice.providerOrder.length > 0) {
      return {
        provider: {
          order: choice.providerOrder,
          allow_fallbacks: false,
        },
      };
    }
    return {};
  }

  async analyze(input: AnalyzeInput, opts?: { model?: string }): Promise<AnalyzeOutput> {
    const model = this.slug(opts?.model);
    const lang = input.lang ?? "en";

    const response = await this.client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: buildSystemPrompt(lang) },
        { role: "user", content: buildUserPrompt(input.sentences, lang, input.contextSentences) },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "report_analysis",
            description: "Report the fallacy analysis for the given text.",
            parameters: ANALYSIS_JSON_SCHEMA,
          },
        },
      ],
      tool_choice: this.toolChoiceFor(opts?.model),
      ...this.openRouterExtras(opts?.model),
    } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming);

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.type !== "function") {
      throw new Error("OpenRouter response missing tool_call");
    }
    const args = toolCall.function.arguments;
    const parsed = AnalysisResultSchema.parse(JSON.parse(args));
    return { provider: this.id, model: this.defaultModel, result: parsed };
  }

  async *analyzeStream(
    input: AnalyzeInput,
    opts?: { model?: string; signal?: AbortSignal },
  ): AsyncGenerator<StreamEvent, { model: string }, void> {
    const model = this.slug(opts?.model);
    const lang = input.lang ?? "en";

    const stream = await this.client.chat.completions.create(
      {
        model,
        messages: [
          { role: "system", content: buildSystemPrompt(lang) },
          { role: "user", content: buildUserPrompt(input.sentences, lang, input.contextSentences) },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_analysis",
              description: "Report the fallacy analysis for the given text.",
              parameters: ANALYSIS_JSON_SCHEMA,
            },
          },
        ],
        tool_choice: this.toolChoiceFor(opts?.model),
        stream: true,
        ...this.openRouterExtras(opts?.model),
      } as OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming,
      opts?.signal ? { signal: opts.signal } : undefined,
    );

    let buffer = "";
    const emittedFindings = new Set<number>();
    const emittedFields = new Set<string>();

    function tryEmit(): StreamEvent[] {
      const out: StreamEvent[] = [];
      if (!buffer) return out;
      let snap: Record<string, unknown> | null = null;
      try {
        snap = partialParse(buffer) as Record<string, unknown>;
      } catch {
        return out;
      }
      if (!snap || typeof snap !== "object") return out;
      const findings = Array.isArray(snap.findings) ? snap.findings : [];
      const lastIdx = findings.length - 1;
      for (let i = 0; i < findings.length; i++) {
        if (emittedFindings.has(i)) continue;
        if (i === lastIdx) continue;
        const parsed = FindingSchema.safeParse(findings[i]);
        if (parsed.success) {
          emittedFindings.add(i);
          out.push({ type: "finding", finding: parsed.data });
        }
      }
      return out;
    }

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      const tc = delta?.tool_calls?.[0];
      const args = tc?.function?.arguments;
      if (args) {
        buffer += args;
        for (const e of tryEmit()) yield e;
      }
    }

    // Strict parse first; if the upstream cut the stream short, fall back
    // to a tolerant partial parse and salvage whatever findings we got.
    let final: ReturnType<typeof AnalysisResultSchema.parse> | null = null;
    try {
      final = AnalysisResultSchema.parse(JSON.parse(buffer));
    } catch {
      try {
        const snap = partialParse(buffer) as Record<string, unknown> | null;
        if (snap && typeof snap === "object") {
          const findings = Array.isArray(snap.findings)
            ? snap.findings
                .map((f) => FindingSchema.safeParse(f))
                .filter((r): r is { success: true; data: Finding } => r.success)
                .map((r) => r.data)
            : [];
          final = {
            language: typeof snap.language === "string" ? snap.language : null,
            summary: typeof snap.summary === "string" ? snap.summary : "",
            score:
              typeof snap.score === "number" && Number.isFinite(snap.score)
                ? Math.max(0, Math.min(100, Math.round(snap.score)))
                : findings.length === 0
                  ? 0
                  : Math.min(100, findings.length * 10),
            findings,
          };
        }
      } catch {
        // ignore
      }
    }

    if (!final) {
      throw new Error(
        `Failed to parse OpenRouter response (buffer length=${buffer.length})`,
      );
    }

    for (let i = 0; i < final.findings.length; i++) {
      if (emittedFindings.has(i)) continue;
      emittedFindings.add(i);
      yield { type: "finding", finding: final.findings[i] };
    }
    if (!emittedFields.has("language")) {
      yield { type: "language", language: final.language ?? null };
      emittedFields.add("language");
    }
    if (!emittedFields.has("summary")) {
      yield { type: "summary", summary: final.summary };
      emittedFields.add("summary");
    }
    if (!emittedFields.has("score")) {
      yield { type: "score", score: final.score };
      emittedFields.add("score");
    }

    return { model: this.defaultModel };
  }

  async *extractClaimsStream(
    input: AnalyzeInput,
    opts?: { model?: string; signal?: AbortSignal },
  ): AsyncGenerator<ClaimStreamEvent, { model: string }, void> {
    const model = this.slug(opts?.model);
    const lang = input.lang ?? "en";

    const stream = await this.client.chat.completions.create(
      {
        model,
        messages: [
          { role: "system", content: buildClaimsSystemPrompt(lang) },
          {
            role: "user",
            content: buildClaimsUserPrompt(
              input.sentences,
              lang,
              input.contextSentences,
            ),
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_claims",
              description:
                "Report the extracted verifiable claims for the given text.",
              parameters: CLAIMS_JSON_SCHEMA,
            },
          },
        ],
        tool_choice: this.toolChoiceFor(opts?.model),
        stream: true,
        ...this.openRouterExtras(opts?.model),
      } as OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming,
      opts?.signal ? { signal: opts.signal } : undefined,
    );

    let buffer = "";
    const emittedClaims = new Set<number>();
    let emittedLanguage = false;

    function tryEmit(): ClaimStreamEvent[] {
      const out: ClaimStreamEvent[] = [];
      if (!buffer) return out;
      let snap: Record<string, unknown> | null = null;
      try {
        snap = partialParse(buffer) as Record<string, unknown>;
      } catch {
        return out;
      }
      if (!snap || typeof snap !== "object") return out;
      const claims = Array.isArray(snap.claims) ? snap.claims : [];
      const lastIdx = claims.length - 1;
      for (let i = 0; i < claims.length; i++) {
        if (emittedClaims.has(i)) continue;
        if (i === lastIdx) continue;
        const parsed = ClaimSchema.safeParse(claims[i]);
        if (parsed.success) {
          emittedClaims.add(i);
          out.push({ type: "claim", claim: parsed.data });
        }
      }
      return out;
    }

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      const tc = delta?.tool_calls?.[0];
      const args = tc?.function?.arguments;
      if (args) {
        buffer += args;
        for (const e of tryEmit()) yield e;
      }
    }

    let final: ReturnType<typeof ClaimExtractionResultSchema.parse> | null = null;
    try {
      final = ClaimExtractionResultSchema.parse(JSON.parse(buffer));
    } catch {
      try {
        const snap = partialParse(buffer) as Record<string, unknown> | null;
        if (snap && typeof snap === "object") {
          const claims = Array.isArray(snap.claims)
            ? snap.claims
                .map((c) => ClaimSchema.safeParse(c))
                .filter((r): r is { success: true; data: Claim } => r.success)
                .map((r) => r.data)
            : [];
          final = {
            language: typeof snap.language === "string" ? snap.language : null,
            claims,
          };
        }
      } catch {
        // ignore
      }
    }

    if (!final) {
      throw new Error(
        `Failed to parse OpenRouter claims response (buffer length=${buffer.length})`,
      );
    }

    for (let i = 0; i < final.claims.length; i++) {
      if (emittedClaims.has(i)) continue;
      emittedClaims.add(i);
      yield { type: "claim", claim: final.claims[i] };
    }
    if (!emittedLanguage) {
      yield { type: "language", language: final.language ?? null };
      emittedLanguage = true;
    }

    return { model: this.defaultModel };
  }

  async *analyzeNeutralityStream(
    input: AnalyzeInput,
    opts?: { model?: string; signal?: AbortSignal },
  ): AsyncGenerator<NeutralityStreamEvent, { model: string }, void> {
    const model = this.slug(opts?.model);
    const lang = input.lang ?? "en";

    const stream = await this.client.chat.completions.create(
      {
        model,
        messages: [
          { role: "system", content: buildNeutralitySystemPrompt(lang) },
          {
            role: "user",
            content: buildNeutralityUserPrompt(
              input.sentences,
              lang,
              input.contextSentences,
            ),
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_neutrality",
              description:
                "Report the neutrality assessment for the given text.",
              parameters: NEUTRALITY_JSON_SCHEMA,
            },
          },
        ],
        tool_choice: this.toolChoiceFor(opts?.model),
        stream: true,
        ...this.openRouterExtras(opts?.model),
      } as OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming,
      opts?.signal ? { signal: opts.signal } : undefined,
    );

    let buffer = "";
    const emittedFindings = new Set<number>();
    const emittedFields = new Set<string>();

    function tryEmit(): NeutralityStreamEvent[] {
      const out: NeutralityStreamEvent[] = [];
      if (!buffer) return out;
      let snap: Record<string, unknown> | null = null;
      try {
        snap = partialParse(buffer) as Record<string, unknown>;
      } catch {
        return out;
      }
      if (!snap || typeof snap !== "object") return out;
      const findings = Array.isArray(snap.findings) ? snap.findings : [];
      const lastIdx = findings.length - 1;
      for (let i = 0; i < findings.length; i++) {
        if (emittedFindings.has(i)) continue;
        if (i === lastIdx) continue;
        const parsed = NeutralityFindingSchema.safeParse(findings[i]);
        if (parsed.success) {
          emittedFindings.add(i);
          out.push({ type: "finding", finding: parsed.data });
        }
      }
      return out;
    }

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      const tc = delta?.tool_calls?.[0];
      const args = tc?.function?.arguments;
      if (args) {
        buffer += args;
        for (const e of tryEmit()) yield e;
      }
    }

    // Strict parse first; fall back to partial salvage on truncated output.
    let final: NeutralityResult | null = null;
    try {
      final = NeutralityResultSchema.parse(JSON.parse(buffer));
    } catch {
      try {
        const snap = partialParse(buffer) as Record<string, unknown> | null;
        if (snap && typeof snap === "object") {
          const findings = Array.isArray(snap.findings)
            ? snap.findings
                .map((f) => NeutralityFindingSchema.safeParse(f))
                .filter(
                  (r): r is { success: true; data: NeutralityFinding } =>
                    r.success,
                )
                .map((r) => r.data)
            : [];
          // Run the whole snapshot through the schema with safeParse so we
          // benefit from the lenient coercions defined there.
          const parsedAll = NeutralityResultSchema.safeParse({
            ...snap,
            findings,
          });
          if (parsedAll.success) final = parsedAll.data;
        }
      } catch {
        // ignore
      }
    }

    if (!final) {
      throw new Error(
        `Failed to parse OpenRouter neutrality response (buffer length=${buffer.length})`,
      );
    }

    for (let i = 0; i < final.findings.length; i++) {
      if (emittedFindings.has(i)) continue;
      emittedFindings.add(i);
      yield { type: "finding", finding: final.findings[i] };
    }
    if (!emittedFields.has("language")) {
      yield { type: "language", language: final.language ?? null };
      emittedFields.add("language");
    }
    if (!emittedFields.has("textType")) {
      yield { type: "textType", textType: final.textType };
      emittedFields.add("textType");
    }
    if (!emittedFields.has("verdict")) {
      yield {
        type: "verdict",
        verdict: final.verdict,
        confidence: final.confidence,
        rationale: final.rationale,
      };
      emittedFields.add("verdict");
    }

    return { model: this.defaultModel };
  }

  async *analyzeSlopStream(
    input: AnalyzeInput,
    opts?: { model?: string; signal?: AbortSignal },
  ): AsyncGenerator<SlopStreamEvent, { model: string }, void> {
    const model = this.slug(opts?.model);
    const lang = input.lang ?? "en";

    const stream = await this.client.chat.completions.create(
      {
        model,
        messages: [
          { role: "system", content: buildSlopSystemPrompt(lang) },
          {
            role: "user",
            content: buildSlopUserPrompt(
              input.sentences,
              lang,
              input.contextSentences,
            ),
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_analysis",
              description: "Report the slop-pattern analysis for the given text.",
              parameters: SLOP_JSON_SCHEMA,
            },
          },
        ],
        tool_choice: this.toolChoiceFor(opts?.model),
        stream: true,
        ...this.openRouterExtras(opts?.model),
      } as OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming,
      opts?.signal ? { signal: opts.signal } : undefined,
    );

    let buffer = "";
    const emittedFindings = new Set<number>();
    const emittedFields = new Set<string>();

    function tryEmit(): SlopStreamEvent[] {
      const out: SlopStreamEvent[] = [];
      if (!buffer) return out;
      let snap: Record<string, unknown> | null = null;
      try {
        snap = partialParse(buffer) as Record<string, unknown>;
      } catch {
        return out;
      }
      if (!snap || typeof snap !== "object") return out;
      const findings = Array.isArray(snap.findings) ? snap.findings : [];
      const lastIdx = findings.length - 1;
      for (let i = 0; i < findings.length; i++) {
        if (emittedFindings.has(i)) continue;
        if (i === lastIdx) continue;
        const parsed = SlopFindingSchema.safeParse(findings[i]);
        if (parsed.success) {
          emittedFindings.add(i);
          out.push({ type: "finding", finding: parsed.data });
        }
      }
      return out;
    }

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      const tc = delta?.tool_calls?.[0];
      const args = tc?.function?.arguments;
      if (args) {
        buffer += args;
        for (const e of tryEmit()) yield e;
      }
    }

    // Strict parse first; fall back to partial salvage on truncated output.
    let final: ReturnType<typeof SlopResultSchema.parse> | null = null;
    try {
      final = SlopResultSchema.parse(JSON.parse(buffer));
    } catch {
      try {
        const snap = partialParse(buffer) as Record<string, unknown> | null;
        if (snap && typeof snap === "object") {
          const findings = Array.isArray(snap.findings)
            ? snap.findings
                .map((f) => SlopFindingSchema.safeParse(f))
                .filter(
                  (r): r is { success: true; data: SlopFinding } => r.success,
                )
                .map((r) => r.data)
            : [];
          final = {
            language: typeof snap.language === "string" ? snap.language : null,
            summary: typeof snap.summary === "string" ? snap.summary : "",
            score:
              typeof snap.score === "number" && Number.isFinite(snap.score)
                ? Math.max(0, Math.min(100, Math.round(snap.score)))
                : findings.length === 0
                  ? 0
                  : Math.min(100, findings.length * 10),
            findings,
          };
        }
      } catch {
        // ignore
      }
    }

    if (!final) {
      throw new Error(
        `Failed to parse OpenRouter slop response (buffer length=${buffer.length})`,
      );
    }

    for (let i = 0; i < final.findings.length; i++) {
      if (emittedFindings.has(i)) continue;
      emittedFindings.add(i);
      yield { type: "finding", finding: final.findings[i] };
    }
    if (!emittedFields.has("language")) {
      yield { type: "language", language: final.language ?? null };
      emittedFields.add("language");
    }
    if (!emittedFields.has("summary")) {
      yield { type: "summary", summary: final.summary };
      emittedFields.add("summary");
    }
    if (!emittedFields.has("score")) {
      yield { type: "score", score: final.score };
      emittedFields.add("score");
    }

    return { model: this.defaultModel };
  }

  async *explainStream(
    input: AnalyzeInput,
    opts: { model?: string; signal?: AbortSignal; level: ExplainLevel },
  ): AsyncGenerator<ExplainStreamEvent, { model: string }, void> {
    const model = this.slug(opts.model);
    const lang = input.lang ?? "en";
    const level = opts.level;

    const stream = await this.client.chat.completions.create(
      {
        model,
        messages: [
          { role: "system", content: buildExplainSystemPrompt(lang, level) },
          {
            role: "user",
            content: buildExplainUserPrompt(
              input.sentences,
              lang,
              input.contextSentences,
            ),
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_explanation",
              description:
                "Report the paragraph-by-paragraph explanation of the given paper.",
              parameters: EXPLAIN_JSON_SCHEMA,
            },
          },
        ],
        tool_choice: this.toolChoiceFor(opts.model),
        stream: true,
        ...this.openRouterExtras(opts.model),
      } as OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming,
      opts.signal ? { signal: opts.signal } : undefined,
    );

    let buffer = "";
    const emittedFindings = new Set<number>();
    const emittedFields = new Set<string>();

    function tryEmit(): ExplainStreamEvent[] {
      const out: ExplainStreamEvent[] = [];
      if (!buffer) return out;
      let snap: Record<string, unknown> | null = null;
      try {
        snap = partialParse(buffer) as Record<string, unknown>;
      } catch {
        return out;
      }
      if (!snap || typeof snap !== "object") return out;
      const findings = Array.isArray(snap.findings) ? snap.findings : [];
      const lastIdx = findings.length - 1;
      for (let i = 0; i < findings.length; i++) {
        if (emittedFindings.has(i)) continue;
        if (i === lastIdx) continue;
        const parsed = ExplainFindingSchema.safeParse(findings[i]);
        if (parsed.success) {
          emittedFindings.add(i);
          out.push({ type: "finding", finding: parsed.data });
        }
      }
      return out;
    }

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      const tc = delta?.tool_calls?.[0];
      const args = tc?.function?.arguments;
      if (args) {
        buffer += args;
        for (const e of tryEmit()) yield e;
      }
    }

    // Strict parse first; fall back to partial salvage on truncated output.
    let final: ExplainResult | null = null;
    try {
      final = ExplainResultSchema.parse(JSON.parse(buffer));
    } catch {
      try {
        const snap = partialParse(buffer) as Record<string, unknown> | null;
        if (snap && typeof snap === "object") {
          const findings = Array.isArray(snap.findings)
            ? snap.findings
                .map((f) => ExplainFindingSchema.safeParse(f))
                .filter(
                  (r): r is { success: true; data: ExplainFinding } => r.success,
                )
                .map((r) => r.data)
            : [];
          const parsedAll = ExplainResultSchema.safeParse({ ...snap, findings });
          if (parsedAll.success) final = parsedAll.data;
        }
      } catch {
        // ignore
      }
    }

    if (!final) {
      throw new Error(
        `Failed to parse OpenRouter explain response (buffer length=${buffer.length})`,
      );
    }

    for (let i = 0; i < final.findings.length; i++) {
      if (emittedFindings.has(i)) continue;
      emittedFindings.add(i);
      yield { type: "finding", finding: final.findings[i] };
    }
    if (!emittedFields.has("language")) {
      yield { type: "language", language: final.language ?? null };
      emittedFields.add("language");
    }
    if (!emittedFields.has("overview")) {
      yield { type: "overview", overview: final.overview };
      emittedFields.add("overview");
    }

    return { model: this.defaultModel };
  }
}
