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
import type { PaperSynthesis } from "../explain-schema";
import type { PaperEvidenceFirstResult } from "../explain-schema";
import type { OpenRouterUsage } from "../openrouter-usage";
import type { PaperSynthesisInput } from "../paper-map-prompt";
import type { PaperEvidenceInput } from "../paper-evidence-prompt";
import type { ExplainInputSection } from "../explain-units";
import type { ExplainDetailInput } from "../explain-detail";
import type {
  LiveContext,
  LiveContextWindow,
} from "../live-context-schema";
import type { EditorialMetadata } from "../ingest/url";
import type { LiveAnalysisConfig } from "../live-analysis-config";

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
  /** Listener-supplied page used only to disambiguate captured media. */
  sourceUrl?: string | null;
  /** Publisher metadata recovered from an ingested article URL. */
  documentMetadata?: EditorialMetadata;
  /** Listener-selected spoken-content format and known participants. */
  analysisConfig?: LiveAnalysisConfig;
};

export type AnalyzeOutput = {
  provider: ProviderId;
  model: string;
  result: AnalysisResult;
  usage?: OpenRouterUsage;
};

export type ExplainInput = {
  sections: ExplainInputSection[];
  lang?: Lang;
  documentMetadata?: EditorialMetadata;
};

export type LlmStreamOptions = {
  model?: string;
  signal?: AbortSignal;
  onUsage?: (usage: OpenRouterUsage) => void;
};

export type ImageTranscriptionInput = {
  base64: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  lang?: Lang;
};

export type ImageTranscriptionOutput = {
  text: string;
  model: string;
  usage?: OpenRouterUsage;
};

export type LiveContextInput = AnalyzeInput & {
  previous: LiveContext;
  finalize?: boolean;
  sourceUrl?: string | null;
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
  analyzeLiveContext(
    input: LiveContextInput,
    opts?: LlmStreamOptions,
  ): Promise<{ model: string; result: LiveContextWindow }>;
  explainStream(
    input: ExplainInput,
    opts: LlmStreamOptions & { level: ExplainLevel },
  ): AsyncGenerator<ExplainStreamEvent, { model: string }, void>;
  explainDetail(
    input: ExplainDetailInput,
    opts?: LlmStreamOptions,
  ): Promise<{ model: string; explanation: string }>;
  synthesizePaperMap(
    input: PaperSynthesisInput,
    opts?: LlmStreamOptions,
  ): Promise<{ model: string; result: PaperSynthesis }>;
  analyzePaperEvidence(
    input: PaperEvidenceInput,
    opts?: LlmStreamOptions,
  ): Promise<{ model: string; result: PaperEvidenceFirstResult }>;
  analyzeSlopStream(
    input: AnalyzeInput,
    opts?: LlmStreamOptions,
  ): AsyncGenerator<SlopStreamEvent, { model: string }, void>;
  transcribeImage(
    input: ImageTranscriptionInput,
    opts?: LlmStreamOptions,
  ): Promise<ImageTranscriptionOutput>;
}
