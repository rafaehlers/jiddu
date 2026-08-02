#!/usr/bin/env node
// Jiddu MCP server — exposes the Jiddu analysis tools over stdio.
//
// Each tool is a thin wrapper over POST /api/v1/* on the deployed Jiddu API.
// Configure JIDDU_API_KEY (required) and optionally JIDDU_API_URL via the MCP
// client's env block (see README).

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { call, get, type CallBody } from "./client.js";

const server = new McpServer({ name: "jiddu", version: "0.1.0" });

const textArg = z
  .string()
  .min(40, "Provide at least 40 characters.")
  .max(2000, "Keep the text under 2000 characters.")
  .describe("The text to analyze (40–2000 characters).");

const factTextArg = z
  .string()
  .min(40, "Provide at least 40 characters.")
  .max(10_000, "Keep fact-check text under 10000 characters.")
  .describe("The text to fact-check (40–10000 characters).");

const langArg = z
  .enum(["en", "pt", "es"])
  .optional()
  .describe("Output language for explanations. Defaults to English.");

// Wrap an API call as an MCP tool result, surfacing errors as tool errors.
async function toolResult(endpoint: string, body: CallBody) {
  try {
    const data = await call(endpoint, body);
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  } catch (err) {
    return {
      isError: true,
      content: [
        { type: "text" as const, text: err instanceof Error ? err.message : String(err) },
      ],
    };
  }
}

async function getToolResult(endpoint: string) {
  try {
    const data = await get(endpoint);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(data, null, 2) },
      ],
    };
  } catch (err) {
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: err instanceof Error ? err.message : String(err),
        },
      ],
    };
  }
}

server.tool(
  "detect_fallacies",
  "Analyze a text and return the logical fallacies it contains, each with the offending excerpt and an explanation. Use this before citing an argument, quoting a source, or including a persuasive claim in a document. Best for 50–2000 characters.",
  { text: textArg, lang: langArg },
  async ({ text, lang }) => toolResult("detect-fallacies", { text, lang }),
);

server.tool(
  "fact_check",
  "Extract the verifiable factual claims from a text and check each one against live web search, returning a per-claim verdict (true / false / misleading / unverifiable) plus an overall reliability verdict. Use to verify content before relying on it as a source. Slower and metered — each claim runs a web search.",
  { text: factTextArg, lang: langArg },
  async ({ text, lang }) => toolResult("fact-check", { text, lang }),
);

server.tool(
  "assess_neutrality",
  "Score how neutral or biased a text is (0–1) and identify specific bias signals — loaded language, one-sidedness, omission, and framing — each with the offending excerpt. Use when evaluating news articles, opinion pieces, or any content where neutrality matters. Does not classify left/right.",
  { text: textArg, lang: langArg },
  async ({ text, lang }) => toolResult("assess-neutrality", { text, lang }),
);

server.tool(
  "detect_slop",
  "Flag AI-slop writing patterns in a text — stock phrases, manufactured drama, templated structures, hollow claims — each with the offending excerpt and an explanation, plus a 0-100 slop score. Detects patterns, never guesses authorship. Use before publishing or trusting polished-sounding prose.",
  { text: textArg, lang: langArg },
  async ({ text, lang }) => toolResult("detect-slop", { text, lang }),
);

server.tool(
  "explain",
  "Explain a dense academic or technical passage paragraph by paragraph at a chosen audience level, tagging each paragraph's role (background, objective, method, result, interpretation, limitation, conclusion). Use to make a hard paper understandable. Best on structured academic text.",
  {
    text: textArg,
    lang: langArg,
    level: z
      .enum(["eli5", "high_school", "undergrad", "expert"])
      .optional()
      .describe("Audience level for the explanation. Defaults to undergrad."),
  },
  async ({ text, lang, level }) => toolResult("explain", { text, lang, level }),
);

server.tool(
  "start_adversarial_review",
  "Start a persisted adversarial review of one complete PDF available at a public URL. Independent SPECS specialists, deterministic checks, source validation, and a separate quality critic feed the final review. Returns a job id immediately; poll it with get_adversarial_review.",
  {
    pdf_url: z
      .string()
      .url()
      .max(2_000)
      .describe(
        "Public HTTP(S) URL of exactly one PDF. Private-network and authenticated URLs are rejected.",
      ),
    lang: langArg,
    venue_profile_id: z.string().max(100).optional(),
    venue: z.string().max(300).optional(),
    venue_year: z.number().int().min(2000).max(2100).optional(),
    venue_track: z.string().max(200).optional(),
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
      .optional(),
    review_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    depth: z
      .enum(["standard", "deep"])
      .optional()
      .describe(
        "Deep uses stronger reasoning and critic models and costs more. Defaults to standard.",
      ),
  },
  async (input) =>
    toolResult("adversarial-reviews", {
      pdf_url: input.pdf_url,
      lang: input.lang,
      venue_profile_id: input.venue_profile_id,
      venue: input.venue,
      venue_year: input.venue_year,
      venue_track: input.venue_track,
      paper_type: input.paper_type,
      review_date: input.review_date,
      depth: input.depth,
    }),
);

server.tool(
  "get_adversarial_review",
  "Check a previously started adversarial-review job. While it is running, returns the current stage. When complete, returns the structured review, viewer URL, Markdown URL, and print/PDF URL.",
  {
    id: z
      .string()
      .regex(/^[A-Za-z0-9_-]{6,30}$/)
      .describe("Job id returned by start_adversarial_review."),
  },
  async ({ id }) => getToolResult(`adversarial-reviews/${id}`),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr is safe for logs; stdout is the MCP transport.
  console.error("jiddu-mcp running on stdio");
}

main().catch((err) => {
  console.error("jiddu-mcp failed to start:", err);
  process.exit(1);
});
