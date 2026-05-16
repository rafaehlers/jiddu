import Anthropic from "@anthropic-ai/sdk";
import { parse as partialParse } from "partial-json";
import { AnalysisResultSchema, FindingSchema } from "../schema";
import { buildSystemPrompt, buildUserPrompt } from "../prompt";
import { ANALYSIS_JSON_SCHEMA } from "./jsonSchema";
import type { AnalyzeInput, AnalyzeOutput, LlmProvider } from "./types";
import type { StreamEvent } from "./stream";

const DEFAULT_MODEL = "claude-sonnet-4-6";

export class AnthropicProvider implements LlmProvider {
  readonly id = "anthropic" as const;
  readonly defaultModel = DEFAULT_MODEL;
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY });
  }

  async analyze(input: AnalyzeInput, opts?: { model?: string }): Promise<AnalyzeOutput> {
    const model = opts?.model ?? DEFAULT_MODEL;
    const lang = input.lang ?? "en";

    const response = await this.client.messages.create({
      model,
      max_tokens: 4096,
      system: [
        { type: "text", text: buildSystemPrompt(lang), cache_control: { type: "ephemeral" } },
      ],
      tools: [
        {
          name: "report_analysis",
          description: "Report the fallacy analysis for the given text.",
          input_schema: ANALYSIS_JSON_SCHEMA as unknown as Anthropic.Tool.InputSchema,
        },
      ],
      tool_choice: { type: "tool", name: "report_analysis" },
      messages: [{ role: "user", content: buildUserPrompt(input.sentences, lang) }],
    });

    const toolUse = response.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Anthropic response missing tool_use block");
    }
    const parsed = AnalysisResultSchema.parse(toolUse.input);
    return { provider: this.id, model, result: parsed };
  }

  async *analyzeStream(
    input: AnalyzeInput,
    opts?: { model?: string; signal?: AbortSignal },
  ): AsyncGenerator<StreamEvent, { model: string }, void> {
    const model = opts?.model ?? DEFAULT_MODEL;
    const lang = input.lang ?? "en";

    const stream = this.client.messages.stream(
      {
        model,
        max_tokens: 8192,
        system: [
          { type: "text", text: buildSystemPrompt(lang), cache_control: { type: "ephemeral" } },
        ],
        tools: [
          {
            name: "report_analysis",
            description: "Report the fallacy analysis for the given text.",
            input_schema: ANALYSIS_JSON_SCHEMA as unknown as Anthropic.Tool.InputSchema,
          },
        ],
        tool_choice: { type: "tool", name: "report_analysis" },
        messages: [{ role: "user", content: buildUserPrompt(input.sentences, lang) }],
      },
      opts?.signal ? { signal: opts.signal } : undefined,
    );

    // Accumulate the raw input JSON ourselves to bypass any SDK partial-parsing quirks.
    let rawJson = "";
    stream.on("streamEvent", (event) => {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "input_json_delta"
      ) {
        rawJson += event.delta.partial_json;
      }
    });

    const queue: StreamEvent[] = [];
    let resolveNext: (() => void) | null = null;
    let done = false;
    let error: unknown = null;
    const emit = (e: StreamEvent) => {
      queue.push(e);
      resolveNext?.();
    };

    const emittedFindings = new Set<number>();
    const emittedFields = new Set<string>();

    stream.on("inputJson", (_partial, snapshot) => {
      try {
        let snap: Record<string, unknown> | undefined;
        if (typeof snapshot === "string") {
          snap = partialParse(snapshot) as Record<string, unknown>;
        } else if (snapshot && typeof snapshot === "object") {
          snap = snapshot as Record<string, unknown>;
        }
        if (!snap || typeof snap !== "object") return;
        const findings = Array.isArray(snap.findings) ? snap.findings : [];
        // Emit findings that look complete (skip the in-progress last one).
        const lastIdx = findings.length - 1;
        for (let i = 0; i < findings.length; i++) {
          if (emittedFindings.has(i)) continue;
          if (i === lastIdx) continue;
          const parsed = FindingSchema.safeParse(findings[i]);
          if (parsed.success) {
            emittedFindings.add(i);
            emit({ type: "finding", finding: parsed.data });
          }
        }
      } catch {
        // ignore partial parse failures
      }
    });

    let finalModel = model;
    const finalResultPromise: Promise<{
      score: number;
      summary: string;
      language: string | null;
      findings: unknown[];
    }> = (async () => {
      const msg = await stream.finalMessage();
      finalModel = msg.model ?? model;
      const tu = msg.content.find((c) => c.type === "tool_use");
      if (!tu || tu.type !== "tool_use") throw new Error("Missing tool_use");

      // Prefer our own accumulated raw JSON; fall back to the SDK's tu.input if
      // accumulation was empty for some reason.
      const rawInput = parseLooseInput(rawJson, tu.input);
      const parsed = AnalysisResultSchema.parse(rawInput);
      return {
        score: parsed.score,
        summary: parsed.summary,
        language: parsed.language ?? null,
        findings: parsed.findings,
      };
    })();

    finalResultPromise.then(
      (final) => {
        // Emit any remaining findings that weren't flushed during streaming.
        for (let i = 0; i < final.findings.length; i++) {
          if (emittedFindings.has(i)) continue;
          const parsed = FindingSchema.safeParse(final.findings[i]);
          if (parsed.success) {
            emittedFindings.add(i);
            emit({ type: "finding", finding: parsed.data });
          }
        }
        if (!emittedFields.has("language")) {
          emit({ type: "language", language: final.language });
          emittedFields.add("language");
        }
        if (!emittedFields.has("summary")) {
          emit({ type: "summary", summary: final.summary });
          emittedFields.add("summary");
        }
        if (!emittedFields.has("score")) {
          emit({ type: "score", score: final.score });
          emittedFields.add("score");
        }
        done = true;
        resolveNext?.();
      },
      (err) => {
        error = err;
        done = true;
        resolveNext?.();
      },
    );

    while (true) {
      if (queue.length > 0) {
        yield queue.shift()!;
        continue;
      }
      if (error) throw error;
      if (done) break;
      await new Promise<void>((res) => {
        resolveNext = () => {
          resolveNext = null;
          res();
        };
      });
    }

    return { model: finalModel };
  }
}

// Robustly parse the tool-use input. Tries full JSON.parse first, then
// partial-json, then SDK's parsed object, then re-parses any nested string
// fields that should have been arrays.
function parseLooseInput(rawJson: string, sdkInput: unknown): unknown {
  let obj: unknown;
  if (rawJson) {
    try {
      obj = JSON.parse(rawJson);
    } catch {
      try {
        obj = partialParse(rawJson);
      } catch {
        obj = undefined;
      }
    }
  }
  if (obj === undefined) {
    obj = typeof sdkInput === "string" ? safeJsonParse(sdkInput) : sdkInput;
  }
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    const o = obj as Record<string, unknown>;
    if (typeof o.findings === "string") {
      const reparsed = safeJsonParse(o.findings);
      if (Array.isArray(reparsed)) o.findings = reparsed;
    }
  }
  return obj;
}

function safeJsonParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    try {
      return partialParse(s);
    } catch {
      return undefined;
    }
  }
}
