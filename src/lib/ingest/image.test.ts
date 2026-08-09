import assert from "node:assert/strict";
import test from "node:test";
import type { LlmProvider } from "@/lib/llm";
import {
  detectImageMime,
  ingestImage,
  MAX_IMAGE_BYTES,
  validateImageBytes,
} from "./image";

test("detects supported screenshot formats from magic bytes", () => {
  assert.equal(
    detectImageMime(
      Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ),
    "image/png",
  );
  assert.equal(
    detectImageMime(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])),
    "image/jpeg",
  );
  assert.equal(
    detectImageMime(
      Uint8Array.from([
        0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
      ]),
    ),
    "image/webp",
  );
});

test("falls back between vision models and returns an image-source document", async () => {
  const attempts: string[] = [];
  const provider = {
    async transcribeImage(
      _input: unknown,
      opts?: { model?: string },
    ) {
      const model = opts?.model ?? "unknown";
      attempts.push(model);
      if (model === "vision-model-a") throw new Error("temporary vision failure");
      return {
        model,
        text: "Speaker A: This is a sufficiently long exact transcription for analysis.",
      };
    },
  } as unknown as LlmProvider;

  const doc = await ingestImage(
    Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    "screenshot.png",
    provider,
    ["vision-model-a", "vision-model-b"],
  );

  assert.deepEqual(attempts, ["vision-model-a", "vision-model-b"]);
  assert.equal(doc.source, "image");
  assert.equal(doc.sourceRef, "screenshot.png");
  assert.match(doc.text, /Speaker A/);
});

test("rejects MIME spoofing and keeps the image cap at 10 MB", () => {
  assert.equal(detectImageMime(new TextEncoder().encode("not an image")), null);
  assert.throws(
    () => validateImageBytes(new TextEncoder().encode("not an image")),
    /Unsupported image type/,
  );
  assert.equal(MAX_IMAGE_BYTES, 10 * 1024 * 1024);
});
