import Anthropic from "@anthropic-ai/sdk";
import { AnalysisResultSchema } from "../schema";
import { SYSTEM_PROMPT, buildUserPrompt } from "../prompt";
import { ANALYSIS_JSON_SCHEMA } from "./jsonSchema";
import type { AnalyzeInput, AnalyzeOutput, LlmProvider } from "./types";

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

    const response = await this.client.messages.create({
      model,
      max_tokens: 4096,
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      ],
      tools: [
        {
          name: "report_analysis",
          description: "Report the fallacy analysis for the given text.",
          input_schema: ANALYSIS_JSON_SCHEMA as unknown as Anthropic.Tool.InputSchema,
        },
      ],
      tool_choice: { type: "tool", name: "report_analysis" },
      messages: [{ role: "user", content: buildUserPrompt(input.sentences) }],
    });

    const toolUse = response.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Anthropic response missing tool_use block");
    }
    const parsed = AnalysisResultSchema.parse(toolUse.input);
    return { provider: this.id, model, result: parsed };
  }
}
