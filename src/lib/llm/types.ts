import type { AnalysisResult } from "../schema";
import type { Sentence } from "../schema";

export type ProviderId = "anthropic" | "openai";

export type AnalyzeInput = {
  sentences: Sentence[];
};

export type AnalyzeOutput = {
  provider: ProviderId;
  model: string;
  result: AnalysisResult;
};

export interface LlmProvider {
  readonly id: ProviderId;
  readonly defaultModel: string;
  analyze(input: AnalyzeInput, opts?: { model?: string }): Promise<AnalyzeOutput>;
}
