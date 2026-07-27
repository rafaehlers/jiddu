// Remote MCP server, hosted in-process on jiddu.app.
//
// Exposes the same tools as the standalone `jiddu-mcp` package, but as an
// HTTP endpoint so clients can connect by URL (via `mcp-remote`) without
// installing or cloning anything. The mcp-handler [transport] segment serves
// /api/mcp (Streamable HTTP) and /api/sse. Tools call the internal run/map
// layer directly — no internal HTTP hop.
//
// Auth: every request must carry the X-Jiddu-Key header (mcp-remote forwards
// it via --header). We validate + rate-limit before delegating to the MCP
// handler, reusing the same key store and buckets as the REST API.

import { AsyncLocalStorage } from "node:async_hooks";
import { after } from "next/server";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  requireApiKey,
  type ApiKeyRecord,
} from "@/lib/api/auth";
import { fetchPublicPdf } from "@/lib/api/pdf-source";
import {
  findPaperReviewJob,
  mapPaperReviewJob,
} from "@/lib/api/paper-review";
import { consume, rateLimitResponse } from "@/lib/rate-limit";
import { loadSettings, bucketFor } from "@/lib/settings";
import { IngestError } from "@/lib/ingest/errors";
import {
  runFallacies,
  runFactCheck,
  runNeutrality,
  runExplain,
  runSlop,
  NoUnitsError,
} from "@/lib/api/run";
import {
  mapFallacies,
  mapFactCheck,
  mapNeutrality,
  mapExplain,
  mapSlop,
} from "@/lib/api/map";
import { normalizeLevel } from "@/lib/explain-schema";
import {
  preparePaperReview,
  runPreparedPaperReview,
} from "@/lib/paper-review-job";
import { resolveVenueProfile } from "@/lib/venues";

export const runtime = "nodejs";
export const maxDuration = 300;

const textArg = z
  .string()
  .min(40, "Provide at least 40 characters.")
  .max(2000, "Keep the text under 2000 characters.")
  .describe("The text to analyze (40–2000 characters).");

const langArg = z
  .enum(["en", "pt", "es"])
  .optional()
  .describe("Output language for explanations. Defaults to English.");

const mcpAuth = new AsyncLocalStorage<ApiKeyRecord>();
const publicOrigin = (() => {
  try {
    return new URL(
      process.env.OPENROUTER_REFERER || "https://jiddu.app",
    ).origin;
  } catch {
    return "https://jiddu.app";
  }
})();

type ToolResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};

function ok(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function fail(err: unknown): ToolResult {
  let message: string;
  if (err instanceof IngestError || err instanceof NoUnitsError) {
    message = err.message;
  } else {
    const m = err instanceof Error ? err.message : String(err);
    message = m.includes("OPENROUTER_API_KEY") ? "Upstream model provider unavailable" : m;
  }
  return { isError: true, content: [{ type: "text", text: message }] };
}

const mcpHandler = createMcpHandler(
  (server) => {
    server.registerTool(
      "detect_fallacies",
      {
        title: "Detect fallacies",
        description:
          "Analyze a text and return the logical fallacies it contains, each with the offending excerpt and an explanation. Use before citing an argument or including a persuasive claim. Best for 50–2000 characters.",
        inputSchema: { text: textArg, lang: langArg },
      },
      async ({ text, lang }) => {
        try {
          return ok(mapFallacies(await runFallacies(text, { lang })));
        } catch (err) {
          return fail(err);
        }
      },
    );

    server.registerTool(
      "fact_check",
      {
        title: "Fact-check",
        description:
          "Extract the verifiable factual claims from a text and check each against live web search, returning per-claim verdicts (true / false / misleading / unverifiable) plus an overall reliability verdict. Slower and metered — each claim runs a web search.",
        inputSchema: { text: textArg, lang: langArg },
      },
      async ({ text, lang }) => {
        try {
          const settings = await loadSettings();
          return ok(
            mapFactCheck(await runFactCheck(text, { lang, maxClaims: settings["api.maxClaims"] })),
          );
        } catch (err) {
          return fail(err);
        }
      },
    );

    server.registerTool(
      "assess_neutrality",
      {
        title: "Assess neutrality",
        description:
          "Score how neutral or biased a text is (0–1) and identify specific bias signals — loaded language, one-sidedness, omission, and framing. Use for news, opinion, or any content where neutrality matters. Does not classify left/right.",
        inputSchema: { text: textArg, lang: langArg },
      },
      async ({ text, lang }) => {
        try {
          return ok(mapNeutrality(await runNeutrality(text, { lang })));
        } catch (err) {
          return fail(err);
        }
      },
    );

    server.registerTool(
      "detect_slop",
      {
        title: "Detect AI slop",
        description:
          "Flag AI-slop writing patterns in a text — stock phrases, manufactured drama, templated structures, hollow claims — each with the offending excerpt and an explanation, plus a 0-100 slop score. Detects patterns, never guesses authorship. Use before publishing or trusting polished-sounding prose.",
        inputSchema: { text: textArg, lang: langArg },
      },
      async ({ text, lang }) => {
        try {
          return ok(mapSlop(await runSlop(text, { lang })));
        } catch (err) {
          return fail(err);
        }
      },
    );

    server.registerTool(
      "explain",
      {
        title: "Explain",
        description:
          "Explain a dense academic or technical passage paragraph by paragraph at a chosen audience level, tagging each paragraph's role (background, objective, method, result, interpretation, limitation, conclusion).",
        inputSchema: {
          text: textArg,
          lang: langArg,
          level: z
            .enum(["eli5", "high_school", "undergrad", "expert"])
            .optional()
            .describe("Audience level. Defaults to undergrad."),
        },
      },
      async ({ text, lang, level }) => {
        try {
          const lvl = normalizeLevel(level);
          return ok(mapExplain(await runExplain(text, { lang, level: lvl }), lvl));
        } catch (err) {
          return fail(err);
        }
      },
    );

    server.registerTool(
      "start_adversarial_review",
      {
        title: "Start adversarial paper review",
        description:
          "Start a persisted adversarial review of one complete PDF available at a public URL. Independent SPECS specialists, deterministic checks, source validation, and a separate quality critic feed the final review. Returns a job id immediately; poll it with get_adversarial_review.",
        inputSchema: {
          pdf_url: z
            .string()
            .url()
            .max(2_000)
            .describe(
              "Public HTTP(S) URL of exactly one PDF. Private-network and authenticated URLs are rejected.",
            ),
          lang: langArg,
          venue_profile_id: z
            .string()
            .max(100)
            .optional()
            .describe(
              "Optional verified profile id, e.g. neurips-2026-main, icml-2026-main, or iclr-2026-main.",
            ),
          venue: z
            .string()
            .max(300)
            .optional()
            .describe("Optional venue name when no verified profile id is known."),
          venue_year: z
            .number()
            .int()
            .min(2000)
            .max(2100)
            .optional()
            .describe("Target edition. Defaults to 2026."),
          venue_track: z
            .string()
            .max(200)
            .optional()
            .describe("Target track. Defaults to the profile's main track."),
          paper_type: z
            .enum([
              "research",
              "position",
              "survey",
              "dataset",
              "theory",
              "use-inspired",
              "concept",
              "negative-results",
            ])
            .optional()
            .describe("Contribution type. Defaults to research."),
          review_date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional()
            .describe("Review date in YYYY-MM-DD. Defaults to today."),
          depth: z
            .enum(["standard", "deep"])
            .optional()
            .describe(
              "Review depth. Deep uses stronger reasoning and critic models and costs more. Defaults to standard.",
            ),
        },
      },
      async ({
        pdf_url,
        lang,
        venue_profile_id,
        venue,
        venue_year,
        venue_track,
        paper_type,
        review_date,
        depth,
      }) => {
        try {
          const auth = mcpAuth.getStore();
          if (!auth) throw new Error("MCP authentication context unavailable.");
          const settings = await loadSettings();
          const rl = consume(
            `mcp:adversarial-review:${auth.id}`,
            bucketFor(settings, "rate.apiReview", auth),
          );
          if (!rl.allowed) {
            throw new Error(
              `Adversarial-review rate limit reached. Retry in ${rl.retryAfterSec}s.`,
            );
          }

          const source = await fetchPublicPdf(pdf_url);
          const venueProfile = resolveVenueProfile({
            profileId: venue_profile_id,
            venueName: venue,
            year: venue_year?.toString(),
            track: venue_track,
            paperType: paper_type,
          });
          const prepared = await preparePaperReview({
            ...source,
            lang: lang ?? "en",
            venueProfile,
            reviewDate:
              review_date ?? new Date().toISOString().slice(0, 10),
            reviewDepth: depth ?? "standard",
          });
          after(async () => {
            await runPreparedPaperReview(prepared).catch((err) => {
              console.error(
                `[mcp:adversarial-review:${prepared.id}]`,
                err instanceof Error ? err.message : err,
              );
            });
          });
          const row = await prisma.paperReview.findUnique({
            where: { id: prepared.id },
          });
          if (!row) throw new Error("Review job could not be created.");
          return ok({
            ...mapPaperReviewJob(row, publicOrigin),
            retry_after_seconds: 10,
            next_tool: "get_adversarial_review",
          });
        } catch (err) {
          return fail(err);
        }
      },
    );

    server.registerTool(
      "get_adversarial_review",
      {
        title: "Get adversarial paper review",
        description:
          "Check a previously started adversarial-review job. While it is running, returns the current stage. When complete, returns the structured review, viewer URL, Markdown URL, and print/PDF URL.",
        inputSchema: {
          id: z
            .string()
            .regex(/^[A-Za-z0-9_-]{6,30}$/)
            .describe("Job id returned by start_adversarial_review."),
        },
      },
      async ({ id }) => {
        try {
          const row = await findPaperReviewJob(id);
          if (!row) throw new Error("Review job not found.");
          return ok({
            ...mapPaperReviewJob(row, publicOrigin),
            ...(row.status === "running"
              ? {
                  retry_after_seconds: 10,
                  next_tool: "get_adversarial_review",
                }
              : {}),
          });
        } catch (err) {
          return fail(err);
        }
      },
    );
  },
  {},
  { basePath: "/api", maxDuration: 300 },
);

// Validate the API key and rate-limit before handing off to the MCP handler.
async function handler(req: Request): Promise<Response> {
  const auth = await requireApiKey(req);
  if (auth instanceof Response) return auth;
  const settings = await loadSettings();
  const rl = consume(`mcp:${auth.id}`, bucketFor(settings, "rate.api", auth));
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);
  return mcpAuth.run(auth, () => mcpHandler(req));
}

export { handler as GET, handler as POST, handler as DELETE };
