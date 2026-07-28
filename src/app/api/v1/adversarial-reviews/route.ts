import { after, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiKey } from "@/lib/api/auth";
import { fetchPublicPdf } from "@/lib/api/pdf-source";
import { jsonError } from "@/lib/api/http";
import { mapPaperReviewJob } from "@/lib/api/paper-review";
import {
  PaperReviewInputError,
  preparePaperReview,
  runPreparedPaperReview,
} from "@/lib/paper-review-job";
import { consume, rateLimitResponse } from "@/lib/rate-limit";
import { bucketFor, loadSettings } from "@/lib/settings";
import { resolveVenueProfile, type PaperType } from "@/lib/venues";
import type { Lang } from "@/lib/fallacies";
import type { ReviewDepth } from "@/lib/paper-review-audit-schema";
import {
  createApiCreditMeter,
  isApiCreditResponse,
} from "@/lib/api/credit-billing";
import {
  creditsForModels,
  paperReviewMaximumModels,
} from "@/lib/jiddu-credit-rates";

export const runtime = "nodejs";
export const maxDuration = 900;

type PublicReviewFields = {
  lang?: unknown;
  venue_profile_id?: unknown;
  venue?: unknown;
  venue_year?: unknown;
  venue_track?: unknown;
  paper_type?: unknown;
  review_date?: unknown;
  depth?: unknown;
  pdf_url?: unknown;
};

export async function POST(req: NextRequest) {
  const auth = await requireApiKey(req);
  if (auth instanceof Response) return auth;

  const settings = await loadSettings();
  const rl = consume(
    `v1:adversarial-review:${auth.id}`,
    bucketFor(settings, "rate.apiReview", auth),
  );
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

  let fields: PublicReviewFields;
  let source: {
    buffer: ArrayBuffer;
    filename: string;
    sourceRef?: string;
  };
  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const files = form.getAll("file");
      if (files.length !== 1 || !(files[0] instanceof File)) {
        return jsonError(
          "Upload exactly one PDF in the `file` field.",
          400,
          "bad_request",
        );
      }
      const file = files[0];
      fields = fieldsFromForm(form);
      source = {
        buffer: await file.arrayBuffer(),
        filename: file.name || "paper.pdf",
      };
    } else if (contentType.includes("application/json")) {
      fields = ((await req.json().catch(() => null)) ??
        {}) as PublicReviewFields;
      if (typeof fields.pdf_url !== "string" || !fields.pdf_url.trim()) {
        return jsonError(
          "Send multipart/form-data with one `file`, or JSON with `pdf_url`.",
          400,
          "bad_request",
        );
      }
      source = await fetchPublicPdf(fields.pdf_url.trim());
    } else {
      return jsonError(
        "Use multipart/form-data with one `file`, or application/json with `pdf_url`.",
        415,
        "unsupported_media_type",
      );
    }

    const options = parseReviewFields(fields);
    const venueProfile = resolveVenueProfile({
      profileId: options.venueProfileId,
      venueName: options.venue,
      year: options.venueYear,
      track: options.venueTrack,
      paperType: options.paperType,
    });
    const prepared = await preparePaperReview({
      buffer: source.buffer,
      filename: source.filename,
      sourceRef: source.sourceRef,
      ownerWorkosUserId: auth.userId,
      lang: options.lang,
      venueProfile,
      reviewDate: options.reviewDate,
      reviewDepth: options.depth,
    });
    const maximumModels = paperReviewMaximumModels({
      depth: prepared.reviewDepth,
      selectedModel: prepared.modelId,
      deepModel: process.env.PAPER_REVIEW_DEEP_MODEL,
      criticModel: process.env.PAPER_REVIEW_CRITIC_MODEL,
    });
    const meter = await createApiCreditMeter(auth, {
      amount: creditsForModels(maximumModels),
      feature:
        prepared.reviewDepth === "deep" ? "review_deep" : "review_standard",
      resourceId: prepared.id,
      metadata: {
        apiKeyId: auth.id,
        depth: prepared.reviewDepth,
        maximumModels,
      },
    });
    if (isApiCreditResponse(meter)) {
      await prisma.paperReview.delete({ where: { id: prepared.id } });
      return meter;
    }

    after(async () => {
      try {
        await runPreparedPaperReview(prepared, {
          apiKey: auth.apiKey,
          callbacks: {
            onBillableCall(event) {
              meter.recordModel(event.model);
            },
            onUsage(usage) {
              meter.recordUsage(usage);
            },
          },
        });
        await meter.settle({ resourceId: prepared.id });
      } catch (err) {
        await meter.settle({
          resourceId: prepared.id,
          note: "REST adversarial review failed before completion.",
        });
        console.error(
          `[api:v1:adversarial-review:${prepared.id}]`,
          err instanceof Error ? err.message : err,
        );
      }
    });

    const row = await prisma.paperReview.findUnique({
      where: { id: prepared.id },
    });
    if (!row) {
      return jsonError("Review job could not be created.", 500, "job_failed");
    }
    const origin = new URL(req.url).origin;
    return Response.json(
      {
        ...mapPaperReviewJob(row, origin),
        retry_after_seconds: 10,
      },
      {
        status: 202,
        headers: {
          location: `${origin}/api/v1/adversarial-reviews/${prepared.id}`,
          "retry-after": "10",
        },
      },
    );
  } catch (err) {
    if (err instanceof PaperReviewInputError) {
      return jsonError(err.message, err.status, err.code);
    }
    return jsonError(
      err instanceof Error ? err.message : "Review job could not be created.",
      422,
      "review_job_failed",
    );
  }
}

export function GET() {
  return jsonError(
    "Use POST with one PDF or a public `pdf_url`, plus an X-Jiddu-Key header.",
    405,
    "method_not_allowed",
  );
}

function fieldsFromForm(form: FormData): PublicReviewFields {
  return {
    lang: form.get("lang"),
    venue_profile_id: form.get("venue_profile_id"),
    venue: form.get("venue"),
    venue_year: form.get("venue_year"),
    venue_track: form.get("venue_track"),
    paper_type: form.get("paper_type"),
    review_date: form.get("review_date"),
    depth: form.get("depth"),
  };
}

function parseReviewFields(fields: PublicReviewFields): {
  lang: Lang;
  venueProfileId?: string;
  venue?: string;
  venueYear?: string;
  venueTrack?: string;
  paperType: PaperType;
  reviewDate: string;
  depth: ReviewDepth;
} {
  const lang = optionalString(fields.lang)?.toLowerCase() ?? "en";
  if (!["en", "pt", "es"].includes(lang)) {
    throw new PaperReviewInputError(
      "`lang` must be `en`, `pt`, or `es`.",
      400,
      "bad_request",
    );
  }
  const paperType = optionalString(fields.paper_type) ?? "research";
  const allowedPaperTypes: PaperType[] = [
    "research",
    "position",
    "survey",
    "dataset",
    "theory",
    "use-inspired",
    "concept",
    "negative-results",
  ];
  if (!allowedPaperTypes.includes(paperType as PaperType)) {
    throw new PaperReviewInputError(
      "`paper_type` is not supported.",
      400,
      "bad_request",
    );
  }
  const suppliedDate = optionalString(fields.review_date);
  if (suppliedDate && !/^\d{4}-\d{2}-\d{2}$/.test(suppliedDate)) {
    throw new PaperReviewInputError(
      "`review_date` must use YYYY-MM-DD.",
      400,
      "bad_request",
    );
  }
  const depth = optionalString(fields.depth) ?? "standard";
  if (depth !== "standard" && depth !== "deep") {
    throw new PaperReviewInputError(
      "`depth` must be `standard` or `deep`.",
      400,
      "bad_request",
    );
  }

  return {
    lang: lang as Lang,
    venueProfileId: optionalString(fields.venue_profile_id)?.slice(0, 100),
    venue: optionalString(fields.venue)?.slice(0, 300),
    venueYear: optionalString(fields.venue_year)?.slice(0, 4),
    venueTrack: optionalString(fields.venue_track)?.slice(0, 200),
    paperType: paperType as PaperType,
    reviewDate: suppliedDate ?? new Date().toISOString().slice(0, 10),
    depth,
  };
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}
