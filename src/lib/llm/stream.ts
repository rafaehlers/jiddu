import type { Finding, Sentence } from "../schema";
import type { ProviderId } from "./types";

export type StreamEvent =
  | { type: "language"; language: string | null }
  | { type: "summary"; summary: string }
  | { type: "score"; score: number }
  | { type: "finding"; finding: Finding };

export type StreamMeta = {
  provider: ProviderId;
  model: string;
};

export type StreamInput = {
  sentences: Sentence[];
};
