import { NextRequest } from "next/server";
import {
  PAPER_REVIEW_STAGE_COUNT,
  PaperReviewInputError,
  preparePaperReview,
  runPreparedPaperReview,
} from "@/lib/paper-review-job";
import { consume, ipFromRequest, rateLimitResponse } from "@/lib/rate-limit";
import { bucketFromSettings, loadSettings } from "@/lib/settings";
import type { Lang } from "@/lib/fallacies";
import { resolveVenueProfile } from "@/lib/venues";

export const runtime = "nodejs";
export const maxDuration = 900;

export async function POST(req: NextRequest) {
  const settings = await loadSettings();
  const rl = consume(
    `review:${ipFromRequest(req)}`,
    bucketFromSettings(settings, "rate.review"),
  );
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return jsonError("A single PDF upload is required.", 415);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError("Invalid multipart form.", 400);
  }

  const files = form.getAll("file");
  if (files.length !== 1 || !(files[0] instanceof File)) {
    return jsonError("Upload exactly one PDF.", 400);
  }
  const file = files[0];
  const filename = file.name || "paper.pdf";
  if (
    !filename.toLowerCase().endsWith(".pdf") &&
    file.type !== "application/pdf"
  ) {
    return jsonError("Adversarial review accepts PDF files only.", 415);
  }

  const lang = normalizeLang(form.get("lang"));
  const venueProfile = resolveVenueProfile({
    profileId: normalizeString(form.get("venueProfileId"))?.slice(0, 100),
    venueName: normalizeString(form.get("venue"))?.slice(0, 300),
    year: normalizeString(form.get("venueYear")),
    track: normalizeString(form.get("venueTrack"))?.slice(0, 200),
    paperType: normalizeString(form.get("paperType")),
  });
  const venueTarget = venueProfile.targetLabel;
  const reviewDate =
    normalizeDate(normalizeString(form.get("reviewDate"))) ??
    new Date().toISOString().slice(0, 10);

  let prepared;
  try {
    prepared = await preparePaperReview({
      buffer: await file.arrayBuffer(),
      filename,
      lang,
      modelId: normalizeString(form.get("model")),
      venueProfile,
      reviewDate,
    });
  } catch (err) {
    if (err instanceof PaperReviewInputError) {
      return jsonError(err.message, err.status, err.code);
    }
    return jsonError("PDF ingestion failed.", 422, "pdf_ingestion_failed");
  }

  const encoder = new TextEncoder();
  const abortController = new AbortController();
  let streamOpen = true;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (!streamOpen) return;
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };
      send("meta", {
        id: prepared.id,
        title: prepared.title,
        source: "pdf",
        sourceRef: filename,
        parser: prepared.parser,
        pageCount: prepared.pageCount,
        visualPageCount: prepared.visualPageCount,
        model: prepared.modelId,
        venueTarget,
        venueProfileVerified: venueProfile.profileVerified,
        chunkCount: PAPER_REVIEW_STAGE_COUNT,
      });

      try {
        const review = await runPreparedPaperReview(prepared, {
          signal: abortController.signal,
          callbacks: {
            onStage(event) {
              send("stage", event);
            },
            onStageDone(event) {
              send("chunkDone", event);
            },
          },
        });
        send("done", {
          id: prepared.id,
          recommendation: review.recommendation,
          weaknessCount: review.weaknesses.length,
        });
        if (streamOpen) controller.close();
        streamOpen = false;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        send("error", { error: message });
        if (streamOpen) controller.close();
        streamOpen = false;
      }
    },
    cancel() {
      streamOpen = false;
      abortController.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
      connection: "keep-alive",
    },
  });
}

function normalizeString(
  value: FormDataEntryValue | string | undefined | null,
): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function normalizeLang(value: FormDataEntryValue | null): Lang {
  return value === "pt" || value === "es" || value === "en" ? value : "en";
}

function normalizeDate(value?: string): string | undefined {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function jsonError(message: string, status: number, code?: string) {
  return new Response(JSON.stringify(code ? { error: message, code } : { error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}
