import OpenAI from "openai";
import { AnalysisResultSchema } from "../schema";
import { SYSTEM_PROMPT, buildUserPrompt } from "../prompt";
import { ANALYSIS_JSON_SCHEMA } from "./jsonSchema";
import type { AnalyzeInput, AnalyzeOutput, LlmProvider } from "./types";

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

    const response = await this.client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input.sentences) },
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
}
