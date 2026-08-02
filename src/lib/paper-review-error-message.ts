export type PaperReviewErrorLanguage = "en" | "pt" | "es";

const MODEL_LABELS: Record<string, string> = {
  "gpt-5.6-luna": "GPT-5.6 Luna",
  "gpt-5.6-luna-pro": "GPT-5.6 Luna Pro",
  "minimax-m3": "MiniMax M3",
};

export function paperReviewCallErrorMessage(args: {
  error: string;
  model: string;
  fallbackModel?: string | null;
  lang: PaperReviewErrorLanguage;
}): string {
  const model = modelLabel(args.model);
  const fallback = args.fallbackModel
    ? modelLabel(args.fallbackModel)
    : null;
  const invalidResponse = isInvalidStructuredResponse(args.error);

  if (args.lang === "pt") {
    if (invalidResponse) {
      return fallback
        ? `${model} retornou uma resposta fora do formato esperado. O Jiddu descartou essa tentativa e continuou automaticamente com ${fallback}.`
        : `${model} retornou uma resposta fora do formato esperado. Os detalhes técnicos foram registrados para diagnóstico.`;
    }
    return fallback
      ? `${model} não conseguiu concluir esta tentativa. O Jiddu continuou automaticamente com ${fallback}.`
      : `${model} não conseguiu concluir esta tentativa. Os detalhes técnicos foram registrados para diagnóstico.`;
  }

  if (args.lang === "es") {
    if (invalidResponse) {
      return fallback
        ? `${model} devolvió una respuesta con un formato inesperado. Jiddu descartó ese intento y continuó automáticamente con ${fallback}.`
        : `${model} devolvió una respuesta con un formato inesperado. Los detalles técnicos se registraron para el diagnóstico.`;
    }
    return fallback
      ? `${model} no pudo completar este intento. Jiddu continuó automáticamente con ${fallback}.`
      : `${model} no pudo completar este intento. Los detalles técnicos se registraron para el diagnóstico.`;
  }

  if (invalidResponse) {
    return fallback
      ? `${model} returned a response in an unexpected format. Jiddu discarded that attempt and continued automatically with ${fallback}.`
      : `${model} returned a response in an unexpected format. Technical details were recorded for diagnosis.`;
  }
  return fallback
    ? `${model} could not complete this attempt. Jiddu continued automatically with ${fallback}.`
    : `${model} could not complete this attempt. Technical details were recorded for diagnosis.`;
}

function isInvalidStructuredResponse(error: string): boolean {
  const normalized = error.toLowerCase();
  return [
    "invalid_type",
    "invalid input",
    "expected string",
    "json",
    "report_analysis",
    "tool call",
  ].some((marker) => normalized.includes(marker));
}

function modelLabel(model: string): string {
  return MODEL_LABELS[model] ?? model;
}
