// Remote MCP server, hosted in-process on jiddu.app.
//
// Exposes the same four tools as the standalone `jiddu-mcp` package, but as an
// HTTP endpoint so clients can connect by URL (via `mcp-remote`) without
// installing or cloning anything. The mcp-handler [transport] segment serves
// /api/mcp (Streamable HTTP) and /api/sse. Tools call the internal run/map
// layer directly — no internal HTTP hop.
//
// Auth: every request must carry the X-Jiddu-Key header (mcp-remote forwards
// it via --header). We validate + rate-limit before delegating to the MCP
// handler, reusing the same key store and buckets as the REST API.

import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { requireApiKey } from "@/lib/api/auth";
import { consume, rateLimitResponse } from "@/lib/rate-limit";
import { loadSettings, bucketFor } from "@/lib/settings";
import { IngestError } from "@/lib/ingest/errors";
import {
  runFallacies,
  runFactCheck,
  runNeutrality,
  runExplain,
  NoUnitsError,
} from "@/lib/api/run";
import {
  mapFallacies,
  mapFactCheck,
  mapNeutrality,
  mapExplain,
} from "@/lib/api/map";
import { normalizeLevel } from "@/lib/explain-schema";

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
  return mcpHandler(req);
}

export { handler as GET, handler as POST, handler as DELETE };
