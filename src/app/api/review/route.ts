import { after, NextRequest } from "next/server";
import {
  PAPER_REVIEW_STAGE_COUNT,
  PaperReviewInputError,
  preparePaperReview,
  runPreparedPaperReview,
} from "@/lib/paper-review-job";
import { consume, ipFromRequest, rateLimitResponse } from "@/lib/rate-limit";
import {
  bucketFromSettings,
  loadSettings,
  loadStringSettings,
} from "@/lib/settings";
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
  createWebAnalysisUsageSettlement,
  isCreditResponse,
  reserveWebAnalysisCredits,
} from "@/lib/web-credit-billing";
import { prisma } from "@/lib/db";
import type { OpenRouterUsage } from "@/lib/openrouter-usage";
import { analysisRoutingFromSettings } from "@/lib/analysis-routing";

export const runtime = "nodejs";
export const maxDuration = 900;

export async function POST(req: NextRequest) {
  const access = await requireWebAnalysisAccess();
  if (isAccessResponse(access)) return access;

  const [settings, routing] = await Promise.all([
    loadSettings(),
    loadStringSettings(),
  ]);
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
  const analysisRouting = analysisRoutingFromSettings(routing);
  const selectedModel = analysisRouting.modelChain[0];
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
    deepModel: routing["paperReview.deepModel"],
    criticModel: routing["paperReview.criticModel"],
  });
  const reviewFeature =
    prepared.reviewDepth === "deep" ? "review_deep" : "review_standard";
  const reservation = await reserveWebAnalysisCredits(access, {
    amount: creditsForModels(maximumModels),
    feature: reviewFeature,
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

  const billableCalls: { operation: string; model: string }[] = [];
  const usages: OpenRouterUsage[] = [];
  const settleUsage = createWebAnalysisUsageSettlement(access, reservation, {
    feature: reviewFeature,
    resourceId: prepared.id,
    metadata: {
      depth: prepared.reviewDepth,
      selectedModel: prepared.modelId,
      maximumModels,
    },
  });
  const settle = () =>
    settleUsage({
      usages,
      fallbackModels: billableCalls.map((call) => call.model),
      metadata: { calls: billableCalls },
    });

  after(async () => {
    try {
      await runPreparedPaperReview(prepared, {
        apiKey: access.apiKey,
        callbacks: {
          onBillableCall(event) {
            billableCalls.push(event);
          },
          onUsage(usage) {
            usages.push(usage);
          },
        },
      });
    } catch (err) {
      console.error(
        `[web:adversarial-review:${prepared.id}]`,
        err instanceof Error ? err.message : err,
      );
    } finally {
      await settle().catch((err) => {
        console.error(
          `[web:adversarial-review:${prepared.id}:billing]`,
          err instanceof Error ? err.message : err,
        );
      });
    }
  });

  return Response.json(
    {
      id: prepared.id,
      status: "running",
      stage: "ledger",
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
      progress: {
        completedStages: 0,
        totalStages: PAPER_REVIEW_STAGE_COUNT,
      },
      viewerUrl: `/r/${prepared.id}`,
      retryAfterSeconds: 10,
    },
    {
      status: 202,
      headers: {
        location: `/r/${prepared.id}`,
        "retry-after": "10",
        "cache-control": "no-store",
      },
    },
  );
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
