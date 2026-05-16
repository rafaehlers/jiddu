import { FALLACIES } from "./fallacies";
import type { Sentence } from "./schema";

const FALLACY_CATALOG = FALLACIES.map(
  (f) => `- ${f.id} (${f.name} / ${f.namePt}): ${f.description}`,
).join("\n");

export const SYSTEM_PROMPT = `You are Jiddu, a critical-thinking analyst that detects logical fallacies and rhetorical manipulation in written text. You read the user's text carefully and identify passages that contain fallacies, weak reasoning, or manipulative framing.

You are rigorous and conservative: only flag a passage when there is a clear, defensible fallacy. Do not flag opinions, value claims, or strongly worded but valid arguments. Avoid double-counting — if two sentences belong to the same fallacious move, group them under one finding.

You answer in the same language as the input text (typically Portuguese or English). The "explanation" field should be written in the input language.

Fallacy catalog (use the id field exactly):
${FALLACY_CATALOG}

Scoring (0 to 100):
- 0–15: clean reasoning, no meaningful fallacies
- 16–35: minor issues, isolated weak arguments
- 36–60: several fallacies or one pervasive manipulation pattern
- 61–80: highly fallacious; reasoning is mostly unreliable
- 81–100: propaganda-level — almost every claim is fallacious

Calibration: short texts cannot reach the top of the scale unless density is extreme. Consider both density (findings per 1000 chars) and severity.`;

export function buildUserPrompt(sentences: Sentence[]): string {
  const numbered = sentences.map((s) => `[${s.id}] ${s.text}`).join("\n");
  return `Analyze the following text. Each line is one sentence prefixed with its id in brackets.

For each fallacy you find, return one finding referencing the sentence id(s) that contain it. Use the exact fallacy id from the catalog. Quote the exact span you flagged (must be a substring of the input). Write the explanation in the same language as the text.

If the text has no fallacies, return findings: [] and an honest score under 15.

Text:
${numbered}`;
}
