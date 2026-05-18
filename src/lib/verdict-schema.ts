import { z } from "zod";

export const VERDICT_VALUES = [
  "supported",
  "contradicted",
  "mixed",
  "unverified",
] as const;

export type VerdictValue = (typeof VERDICT_VALUES)[number];

// Coerce sloppy verdict strings (e.g. "true" / "false" / "partially supported")
// into one of our canonical labels so a quirky model doesn't kill the run.
const VerdictValueSchema = z.preprocess((v) => {
  if (typeof v !== "string") return "unverified";
  const s = v.toLowerCase().trim();
  if ((VERDICT_VALUES as readonly string[]).includes(s)) return s;
  if (["true", "correct", "verified", "accurate", "confirmed"].includes(s)) return "supported";
  if (["false", "incorrect", "inaccurate", "wrong", "refuted"].includes(s)) return "contradicted";
  if (
    ["partially supported", "partial", "partially_supported", "partly true", "complicated"].includes(s)
  )
    return "mixed";
  if (
    [
      "uncertain",
      "no evidence",
      "inconclusive",
      "unknown",
      "insufficient",
      "insufficient_evidence",
    ].includes(s)
  )
    return "unverified";
  return "unverified";
}, z.enum(VERDICT_VALUES));

export const VerdictSourceSchema = z.object({
  url: z.string().url(),
  title: z.string().nullable().optional(),
  snippet: z.string().nullable().optional(),
});
export type VerdictSource = z.infer<typeof VerdictSourceSchema>;

// Shape parsed straight out of the LLM `content` field. Sources come from
// the message.annotations / message.citations channels and are merged in
// after parsing by the caller.
export const VerdictPayloadSchema = z.object({
  verdict: VerdictValueSchema,
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(1),
});
export type VerdictPayload = z.infer<typeof VerdictPayloadSchema>;

// The persisted shape — verdict + claim link + sources + provenance.
export type Verdict = {
  claimId: string;
  verdict: VerdictValue;
  confidence: number;
  rationale: string;
  sources: VerdictSource[];
  model: string;
};

// Per the roadmap: low-confidence verdicts collapse to "unverified" so we
// don't expose a false-positive label to the user.
export const CONFIDENCE_FLOOR = 0.5;

export function applyConfidenceFloor(v: Omit<Verdict, "sources" | "model">): Omit<Verdict, "sources" | "model"> {
  if (v.confidence < CONFIDENCE_FLOOR && v.verdict !== "unverified") {
    return { ...v, verdict: "unverified" };
  }
  return v;
}
