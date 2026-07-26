import type { Finding, Sentence } from "../schema";
import type { Claim } from "../claims-schema";
import type {
  NeutralityFinding,
  NeutralityVerdictValue,
  TextType,
} from "../neutrality-schema";
import type { ExplainFinding } from "../explain-schema";
import type { SlopFinding } from "../slop-schema";
import type { ProviderId } from "./types";

export type StreamEvent =
  | { type: "language"; language: string | null }
  | { type: "summary"; summary: string }
  | { type: "score"; score: number }
  | { type: "finding"; finding: Finding };

export type ClaimStreamEvent =
  | { type: "language"; language: string | null }
  | { type: "claim"; claim: Claim };

export type NeutralityStreamEvent =
  | { type: "language"; language: string | null }
  | { type: "textType"; textType: TextType }
  | {
      type: "verdict";
      verdict: NeutralityVerdictValue;
      confidence: number;
      rationale: string;
    }
  | { type: "finding"; finding: NeutralityFinding };

export type ExplainStreamEvent =
  | { type: "language"; language: string | null }
  | { type: "overview"; overview: string }
  | { type: "finding"; finding: ExplainFinding };

// Slop detection shares the fallacy pipeline's event shape (score + summary
// + per-sentence findings), just with SlopFinding as the payload.
export type SlopStreamEvent =
  | { type: "language"; language: string | null }
  | { type: "summary"; summary: string }
  | { type: "score"; score: number }
  | { type: "finding"; finding: SlopFinding };

export type StreamMeta = {
  provider: ProviderId;
  model: string;
};

export type StreamInput = {
  sentences: Sentence[];
};
