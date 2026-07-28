import type { AnalysisResult } from "../schema";
import type { Sentence } from "../schema";
import type {
  ClaimStreamEvent,
  ExplainStreamEvent,
  NeutralityStreamEvent,
  SlopStreamEvent,
  StreamEvent,
} from "./stream";
import type { Lang } from "../fallacies";
import type { ExplainLevel } from "../explain-schema";
import type { OpenRouterUsage } from "../openrouter-usage";

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
  usage?: OpenRouterUsage;
};

export type LlmStreamOptions = {
  model?: string;
  signal?: AbortSignal;
  onUsage?: (usage: OpenRouterUsage) => void;
};

export interface LlmProvider {
  readonly id: ProviderId;
  readonly defaultModel: string;
  analyze(input: AnalyzeInput, opts?: LlmStreamOptions): Promise<AnalyzeOutput>;
  analyzeStream(
    input: AnalyzeInput,
    opts?: LlmStreamOptions,
  ): AsyncGenerator<StreamEvent, { model: string }, void>;
  extractClaimsStream(
    input: AnalyzeInput,
    opts?: LlmStreamOptions,
  ): AsyncGenerator<ClaimStreamEvent, { model: string }, void>;
  analyzeNeutralityStream(
    input: AnalyzeInput,
    opts?: LlmStreamOptions,
  ): AsyncGenerator<NeutralityStreamEvent, { model: string }, void>;
  explainStream(
    input: AnalyzeInput,
    opts: LlmStreamOptions & { level: ExplainLevel },
  ): AsyncGenerator<ExplainStreamEvent, { model: string }, void>;
  analyzeSlopStream(
    input: AnalyzeInput,
    opts?: LlmStreamOptions,
  ): AsyncGenerator<SlopStreamEvent, { model: string }, void>;
}
