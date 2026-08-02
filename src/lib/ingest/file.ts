import "server-only";

import { DEFAULT_MODEL_CHAIN } from "@/lib/llm/fallback";
import { getProvider, resolveModel } from "@/lib/llm";
import type { Lang } from "@/lib/fallacies";
import type { JidduCreditFeature } from "@/lib/jiddu-credit-rates";
import { maxCreditsForCalls } from "@/lib/jiddu-credit-rates";
import type { OpenRouterUsage } from "@/lib/openrouter-usage";
import type { WebAnalysisAccess } from "@/lib/web-analysis-access";
import {
  createWebAnalysisUsageSettlement,
  isCreditResponse,
  reserveWebAnalysisCredits,
} from "@/lib/web-credit-billing";
import { IngestError } from "./errors";
import { ingestImage, MAX_IMAGE_BYTES, validateImageBytes } from "./image";
import { ingestPdf } from "./pdf";
import { ingestText } from "./text";
import type { IngestedDocument } from "./url";

type AnalysisFileOptions = {
  access: WebAnalysisAccess;
  feature: JidduCreditFeature;
  resourceId: string;
  modelId?: string;
  lang: Lang;
  signal?: AbortSignal;
};

export async function ingestAnalysisFile(
  file: File,
  opts: AnalysisFileOptions,
): Promise<IngestedDocument | Response> {
  if (isImageLikeFile(file) && file.size > MAX_IMAGE_BYTES) {
    throw new IngestError(
      "file_too_large",
      "The image exceeds the 10 MB upload limit.",
    );
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const name = file.name || "upload";
  const lower = name.toLowerCase();

  if (lower.endsWith(".pdf") || file.type === "application/pdf") {
    return ingestPdf(bytes.buffer, name, {
      // Explain benefits from LiteParse's Markdown/heading structure. Other
      // fast pipelines keep the lighter prose-only extraction path.
      mode: opts.feature === "explain" ? "academic" : "fast",
    });
  }
  if (lower.endsWith(".txt") || file.type.startsWith("text/")) {
    return ingestText(new TextDecoder().decode(bytes), {
      title: name,
      sourceRef: name,
    });
  }
  if (!isImageLikeFile(file)) {
    throw new IngestError(
      "unsupported_file",
      "Unsupported file type. Use PDF, TXT, PNG, JPEG, or WebP.",
    );
  }
  validateImageBytes(bytes);

  const modelChain: string[] = opts.modelId
    ? Array.from(
        new Set([resolveModel(opts.modelId).id, ...DEFAULT_MODEL_CHAIN]),
      )
    : [...DEFAULT_MODEL_CHAIN];
  const reservation = await reserveWebAnalysisCredits(opts.access, {
    amount: maxCreditsForCalls(modelChain, 1),
    minimumAvailable: maxCreditsForCalls(modelChain, 2),
    feature: opts.feature,
    resourceId: opts.resourceId,
    metadata: { stage: "image_transcription", modelChain },
  });
  if (isCreditResponse(reservation)) return reservation;
  const settleUsage = createWebAnalysisUsageSettlement(
    opts.access,
    reservation,
    {
      feature: opts.feature,
      resourceId: opts.resourceId,
      metadata: { stage: "image_transcription", modelChain },
    },
  );

  const usages: OpenRouterUsage[] = [];
  const models: string[] = [];
  let completed = false;
  try {
    const provider = getProvider(modelChain[0], opts.access.apiKey);
    const doc = await ingestImage(bytes, name, provider, modelChain, {
      lang: opts.lang,
      signal: opts.signal,
      onUsage: (usage) => usages.push(usage),
      onModelUsed: (model) => models.push(model),
    });
    completed = true;
    return doc;
  } finally {
    await settleUsage({
      usages,
      fallbackModels: models,
      note: "Screenshot text transcription",
      metadata: {
        stage: "image_transcription",
        completed,
        models,
        filename: name.slice(0, 500),
      },
    });
  }
}

function isImageLikeFile(file: File): boolean {
  return (
    file.type.startsWith("image/") ||
    /\.(?:png|jpe?g|webp)$/i.test(file.name)
  );
}
