import OpenAI from "openai";
import { parse as partialParse } from "partial-json";
import { AnalysisResultSchema, FindingSchema } from "../schema";
import { buildSystemPrompt, buildUserPrompt } from "../prompt";
import { ANALYSIS_JSON_SCHEMA } from "./jsonSchema";
import type { AnalyzeInput, AnalyzeOutput, LlmProvider, ProviderId } from "./types";
import type { StreamEvent } from "./stream";

// Curated catalog of OpenRouter models exposed in the UI dropdown. Each entry
// pairs a stable internal id (used as the value in DB + form) with the
// upstream OpenRouter slug.
export type ModelChoice = {
  id: string;
  label: string;
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
};

export const MODEL_CATALOG: ModelChoice[] = [
  {
    id: "claude-opus-4.7",
    label: "Claude Opus 4.7",
    family: "anthropic",
    openrouter: "anthropic/claude-opus-4.7",
  },
  {
    id: "claude-sonnet-4.6",
    label: "Claude Sonnet 4.6",
    family: "anthropic",
    openrouter: "anthropic/claude-sonnet-4.6",
  },
  {
    id: "gpt-5.4",
    label: "GPT-5.4",
    family: "openai",
    openrouter: "openai/gpt-5.4",
  },
  {
    id: "gpt-5.4-mini",
    label: "GPT-5.4 mini",
    family: "openai",
    openrouter: "openai/gpt-5.4-mini",
  },
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    family: "google",
    openrouter: "google/gemini-2.5-pro",
  },
  {
    id: "deepseek-v4-pro",
    label: "DeepSeek V4 Pro",
    family: "deepseek",
    openrouter: "deepseek/deepseek-v4-pro",
  },
  {
    id: "qwen3.6-plus",
    label: "Qwen3.6 Plus",
    family: "qwen",
    openrouter: "qwen/qwen3.6-plus",
    toolMode: "auto",
  },
  {
    id: "kimi-k2.6",
    label: "Kimi K2.6 (Moonshot)",
    family: "moonshot",
    openrouter: "moonshotai/kimi-k2.6",
  },
  {
    id: "glm-5",
    label: "GLM-5 (Zhipu)",
    family: "zhipu",
    openrouter: "z-ai/glm-5",
  },
  {
    id: "minimax-m2.7",
    label: "MiniMax M2.7",
    family: "minimax",
    openrouter: "minimax/minimax-m2.7",
  },
];

const MODEL_BY_ID: Record<string, ModelChoice> = Object.fromEntries(
  MODEL_CATALOG.map((m) => [m.id, m]),
);

const DEFAULT_MODEL_ID = "claude-opus-4.7";

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

  async analyze(input: AnalyzeInput, opts?: { model?: string }): Promise<AnalyzeOutput> {
    const model = this.slug(opts?.model);
    const lang = input.lang ?? "en";

    const response = await this.client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: buildSystemPrompt(lang) },
        { role: "user", content: buildUserPrompt(input.sentences, lang) },
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
    });

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
          { role: "user", content: buildUserPrompt(input.sentences, lang) },
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
      },
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

    try {
      const final = AnalysisResultSchema.parse(JSON.parse(buffer));
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
    } catch (err) {
      throw new Error(
        `Failed to parse OpenRouter final JSON: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return { model: this.defaultModel };
  }
}
