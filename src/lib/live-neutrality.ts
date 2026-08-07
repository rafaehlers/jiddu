import {
  NEUTRALITY_VERDICTS,
  TEXT_TYPES,
  type NeutralityVerdictValue,
  type TextType,
} from "./neutrality-schema";

export type StoredLiveNeutrality = {
  verdict: string;
  confidence: number;
  rationale: string | null;
  textType: string | null;
} | null;

export type LiveNeutralityWindow = {
  verdict: NeutralityVerdictValue | null;
  confidence: number;
  rationale: string;
  textType: TextType | null;
};

const NEUTRALITY_RANK: Record<NeutralityVerdictValue, number> = {
  neutral: 0,
  partisan_lean: 1,
  explicitly_partisan: 2,
  manipulation: 3,
};

/**
 * Running assessments retain the strongest signal observed so far. A final
 * assessment is holistic, so its result replaces the running aggregate and
 * may legitimately move in either direction.
 */
export function resolveLiveNeutrality(
  current: StoredLiveNeutrality,
  window: LiveNeutralityWindow,
  final: boolean,
): {
  verdict: NeutralityVerdictValue;
  confidence: number;
  rationale: string;
  textType: TextType;
} {
  const currentVerdict = normalizeNeutralityVerdict(current?.verdict);
  const useWindow =
    window.verdict !== null &&
    (final ||
      current?.verdict === "pending" ||
      NEUTRALITY_RANK[window.verdict] > NEUTRALITY_RANK[currentVerdict] ||
      (window.verdict === currentVerdict &&
        window.confidence >= (current?.confidence ?? 0)));

  return {
    verdict: useWindow ? window.verdict! : currentVerdict,
    confidence: useWindow
      ? window.confidence
      : Math.max(0, current?.confidence ?? 0),
    rationale: useWindow
      ? window.rationale
      : current?.rationale ?? window.rationale,
    textType: window.textType ?? normalizeTextType(current?.textType),
  };
}

function normalizeNeutralityVerdict(value: unknown): NeutralityVerdictValue {
  return NEUTRALITY_VERDICTS.includes(value as NeutralityVerdictValue)
    ? (value as NeutralityVerdictValue)
    : "neutral";
}

function normalizeTextType(value: unknown): TextType {
  return TEXT_TYPES.includes(value as TextType)
    ? (value as TextType)
    : "informational";
}
