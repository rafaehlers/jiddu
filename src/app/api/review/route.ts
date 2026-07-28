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
import type { ReviewDepth } from "@/lib/paper-review-audit-schema";
import {
  isAccessResponse,
  requireWebAnalysisAccess,
} from "@/lib/web-analysis-access";
import {
  creditsForModels,
  paperReviewMaximumModels,
} from "@/lib/jiddu-credit-rates";
import {
  settleJidduCreditReservationFromUsage,
} from "@/lib/jiddu-credits";
import {
  isCreditResponse,
  reserveWebAnalysisCredits,
} from "@/lib/web-credit-billing";
import { prisma } from "@/lib/db";
import type { OpenRouterUsage } from "@/lib/openrouter-usage";

export const runtime = "nodejs";
export const maxDuration = 900;

export async function POST(req: NextRequest) {
  const access = await requireWebAnalysisAccess();
  if (isAccessResponse(access)) return access;

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
  const selectedModel = normalizeString(form.get("model")) ?? "gpt-5.4-mini";
  const reviewDepth = normalizeReviewDepth(form.get("reviewDepth"));

  let prepared;
  try {
    prepared = await preparePaperReview({
      buffer: await file.arrayBuffer(),
      filename,
      ownerWorkosUserId: access.userId,
      lang,
      modelId: selectedModel,
      reviewDepth,
      venueProfile,
      reviewDate,
    });
  } catch (err) {
    if (err instanceof PaperReviewInputError) {
      return jsonError(err.message, err.status, err.code);
    }
    return jsonError("PDF ingestion failed.", 422, "pdf_ingestion_failed");
  }

  const maximumModels = paperReviewMaximumModels({
    depth: prepared.reviewDepth,
    selectedModel: prepared.modelId,
    deepModel: process.env.PAPER_REVIEW_DEEP_MODEL,
    criticModel: process.env.PAPER_REVIEW_CRITIC_MODEL,
  });
  const reservation = await reserveWebAnalysisCredits(access, {
    amount: creditsForModels(maximumModels),
    feature:
      prepared.reviewDepth === "deep" ? "review_deep" : "review_standard",
    resourceId: prepared.id,
    metadata: {
      depth: prepared.reviewDepth,
      selectedModel: prepared.modelId,
      maximumModels,
    },
  });
  if (isCreditResponse(reservation)) {
    await prisma.paperReview.delete({ where: { id: prepared.id } });
    return reservation;
  }

  const encoder = new TextEncoder();
  const abortController = new AbortController();
  let streamOpen = true;
  const billableCalls: { operation: string; model: string }[] = [];
  const usages: OpenRouterUsage[] = [];
  let settled = false;
  const settle = async () => {
    if (settled) return;
    settled = true;
    await settleJidduCreditReservationFromUsage(
      reservation,
      {
        usages,
        fallbackModels: billableCalls.map((call) => call.model),
        resourceId: prepared.id,
        metadata: { calls: billableCalls },
      },
    );
  };

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
        reviewDepth: prepared.reviewDepth,
        venueTarget,
        venueProfileVerified: venueProfile.profileVerified,
        chunkCount: PAPER_REVIEW_STAGE_COUNT,
      });

      try {
        const review = await runPreparedPaperReview(prepared, {
          signal: abortController.signal,
          apiKey: access.apiKey,
          callbacks: {
            onStage(event) {
              send("stage", event);
            },
            onStageDone(event) {
              send("chunkDone", event);
            },
            onBillableCall(event) {
              billableCalls.push(event);
            },
            onUsage(usage) {
              usages.push(usage);
            },
          },
        });
        send("done", {
          id: prepared.id,
          recommendation: review.recommendation,
          weaknessCount: review.weaknesses.length,
        });
        await settle();
        if (streamOpen) controller.close();
        streamOpen = false;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        send("error", { error: message });
        await settle();
        if (streamOpen) controller.close();
        streamOpen = false;
      }
    },
    async cancel() {
      streamOpen = false;
      abortController.abort();
      await settle();
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

function normalizeReviewDepth(value: FormDataEntryValue | null): ReviewDepth {
  return value === "deep" ? "deep" : "standard";
}

function jsonError(message: string, status: number, code?: string) {
  return new Response(JSON.stringify(code ? { error: message, code } : { error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}
