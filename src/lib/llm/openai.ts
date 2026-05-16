import OpenAI from "openai";
import { parse as partialParse } from "partial-json";
import { AnalysisResultSchema, FindingSchema } from "../schema";
import { buildSystemPrompt, buildUserPrompt } from "../prompt";
import { ANALYSIS_JSON_SCHEMA } from "./jsonSchema";
import type { AnalyzeInput, AnalyzeOutput, LlmProvider } from "./types";
import type { StreamEvent } from "./stream";

const DEFAULT_MODEL = "gpt-4.1-mini";

export class OpenAIProvider implements LlmProvider {
  readonly id = "openai" as const;
  readonly defaultModel = DEFAULT_MODEL;
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({ apiKey: apiKey ?? process.env.OPENAI_API_KEY });
  }

  async analyze(input: AnalyzeInput, opts?: { model?: string }): Promise<AnalyzeOutput> {
    const model = opts?.model ?? DEFAULT_MODEL;
    const lang = input.lang ?? "en";

    const response = await this.client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: buildSystemPrompt(lang) },
        { role: "user", content: buildUserPrompt(input.sentences, lang) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "analysis_result",
          strict: true,
          schema: ANALYSIS_JSON_SCHEMA,
        },
      },
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error("OpenAI response missing content");
    const parsed = AnalysisResultSchema.parse(JSON.parse(raw));
    return { provider: this.id, model, result: parsed };
  }

  async *analyzeStream(
    input: AnalyzeInput,
    opts?: { model?: string; signal?: AbortSignal },
  ): AsyncGenerator<StreamEvent, { model: string }, void> {
    const model = opts?.model ?? DEFAULT_MODEL;
    const lang = input.lang ?? "en";

    const stream = await this.client.chat.completions.create(
      {
        model,
        messages: [
          { role: "system", content: buildSystemPrompt(lang) },
          { role: "user", content: buildUserPrompt(input.sentences, lang) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "analysis_result",
            strict: true,
            schema: ANALYSIS_JSON_SCHEMA,
          },
        },
        stream: true,
      },
      opts?.signal ? { signal: opts.signal } : undefined,
    );

    let buffer = "";
    const emittedFindings = new Set<number>();
    const emittedFields = new Set<string>();

    let lastEmittedSummary = "";

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
      if (typeof snap.summary === "string" && snap.summary.length > lastEmittedSummary.length + 24) {
        // We don't progressively emit the summary; we wait for it to settle below.
      }
      return out;
    }

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (!delta) continue;
      buffer += delta;
      const events = tryEmit();
      for (const e of events) yield e;
    }

    // Final parse: emit any remaining findings + final fields.
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
        lastEmittedSummary = final.summary;
        emittedFields.add("summary");
      }
      if (!emittedFields.has("score")) {
        yield { type: "score", score: final.score };
        emittedFields.add("score");
      }
    } catch (err) {
      throw new Error(
        `Failed to parse OpenAI final JSON: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return { model };
  }
}
