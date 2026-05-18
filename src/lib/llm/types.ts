import type { AnalysisResult } from "../schema";
import type { Sentence } from "../schema";
import type { ClaimStreamEvent, StreamEvent } from "./stream";
import type { Lang } from "../fallacies";

export type ProviderId = "anthropic" | "openai";

export type AnalyzeInput = {
  sentences: Sentence[];
  lang?: Lang;
  /**
   * Optional previous sentences provided to the LLM purely as context so it
   * can resolve anaphora and references. Findings emitted against these
   * sentences are ignored by callers (the prompt instructs the model not to
   * emit them, but we filter defensively).
   */
  contextSentences?: Sentence[];
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
  analyzeStream(
    input: AnalyzeInput,
    opts?: { model?: string; signal?: AbortSignal },
  ): AsyncGenerator<StreamEvent, { model: string }, void>;
  extractClaimsStream(
    input: AnalyzeInput,
    opts?: { model?: string; signal?: AbortSignal },
  ): AsyncGenerator<ClaimStreamEvent, { model: string }, void>;
}
