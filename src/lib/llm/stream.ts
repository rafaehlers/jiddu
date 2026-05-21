import type { Finding, Sentence } from "../schema";
import type { Claim } from "../claims-schema";
import type {
  NeutralityFinding,
  NeutralityVerdictValue,
  TextType,
} from "../neutrality-schema";
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

export type StreamMeta = {
  provider: ProviderId;
  model: string;
};

export type StreamInput = {
  sentences: Sentence[];
};
