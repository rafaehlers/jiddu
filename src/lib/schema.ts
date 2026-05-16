import { z } from "zod";
import { FALLACY_IDS } from "./fallacies";

export const SentenceSchema = z.object({
  id: z.string(),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
  text: z.string(),
});
export type Sentence = z.infer<typeof SentenceSchema>;

export const FindingSchema = z.object({
  sentenceIds: z.array(z.string()).min(1),
  fallacy: z.enum(FALLACY_IDS as [string, ...string[]]),
  severity: z.enum(["low", "medium", "high"]),
  quote: z.string(),
  explanation: z.string(),
});
export type Finding = z.infer<typeof FindingSchema>;

export const AnalysisResultSchema = z.object({
  language: z.string().nullable().optional(),
  score: z.number().int().min(0).max(100),
  summary: z.string(),
  findings: z.array(FindingSchema),
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
