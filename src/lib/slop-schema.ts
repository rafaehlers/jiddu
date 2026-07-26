import { z } from "zod";
import { SLOP_IDS } from "./slop";

// Mirrors src/lib/schema.ts (fallacy pipeline) — same Sentence unit, same
// finding shape, same 0-100 score contract — with the pattern enum swapped
// for the slop catalog.

const SeveritySchema = z.preprocess((v) => {
  if (v === "low" || v === "high") return v;
  if (typeof v !== "string") return "low";
  const s = v.toLowerCase().trim();
  if (["high", "severe", "strong", "critical", "major", "serious"].includes(s)) return "high";
  if (["low", "mild", "minor", "weak", "medium", "moderate", "mid"].includes(s)) return "low";
  return "low";
}, z.enum(["low", "high"]));

export const SlopFindingSchema = z.object({
  sentenceIds: z.array(z.string()).min(1),
  pattern: z.enum(SLOP_IDS as [string, ...string[]]),
  severity: SeveritySchema,
  quote: z.string(),
  explanation: z.string(),
});
export type SlopFinding = z.infer<typeof SlopFindingSchema>;

export const SlopResultSchema = z.object({
  language: z.string().nullable().optional(),
  score: z.number().int().min(0).max(100),
  summary: z.string(),
  findings: z.array(SlopFindingSchema),
});
export type SlopResult = z.infer<typeof SlopResultSchema>;
