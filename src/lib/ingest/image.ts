import type { Lang } from "@/lib/fallacies";
import type { LlmProvider } from "@/lib/llm";
import type { OpenRouterUsage } from "@/lib/openrouter-usage";
import { IngestError } from "./errors";
import { ingestText } from "./text";
import type { IngestedDocument } from "./url";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export type SupportedImageMime =
  | "image/png"
  | "image/jpeg"
  | "image/webp";

export function detectImageMime(bytes: Uint8Array): SupportedImageMime | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 12 &&
    ascii(bytes, 0, 4) === "RIFF" &&
    ascii(bytes, 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function validateImageBytes(bytes: Uint8Array): SupportedImageMime {
  if (bytes.byteLength === 0) {
    throw new IngestError("extraction_failed", "The pasted image is empty.");
  }
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new IngestError(
      "file_too_large",
      "The image exceeds the 10 MB upload limit.",
    );
  }
  const mimeType = detectImageMime(bytes);
  if (!mimeType) {
    throw new IngestError(
      "unsupported_file",
      "Unsupported image type. Use PNG, JPEG, or WebP.",
    );
  }
  return mimeType;
}

export async function ingestImage(
  bytes: Uint8Array,
  filename: string,
  provider: LlmProvider,
  modelChain: readonly string[],
  opts?: {
    lang?: Lang;
    signal?: AbortSignal;
    onUsage?: (usage: OpenRouterUsage) => void;
    onModelUsed?: (model: string) => void;
  },
): Promise<IngestedDocument> {
  const mimeType = validateImageBytes(bytes);

  let lastError: unknown;
  for (const model of modelChain) {
    if (opts?.signal?.aborted) throw new Error("aborted");
    try {
      const result = await provider.transcribeImage(
        {
          base64: Buffer.from(bytes).toString("base64"),
          mimeType,
          lang: opts?.lang,
        },
        {
          model,
          signal: opts?.signal,
          onUsage: opts?.onUsage,
        },
      );
      opts?.onModelUsed?.(result.model);
      return ingestText(result.text, {
        title: filename,
        sourceRef: filename,
        source: "image",
      });
    } catch (error) {
      lastError = error;
      if (error instanceof IngestError || opts?.signal?.aborted) throw error;
    }
  }

  throw new IngestError(
    "extraction_failed",
    `Could not read text from the image: ${
      lastError instanceof Error ? lastError.message : "vision model failed"
    }`,
  );
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.subarray(start, end));
}
