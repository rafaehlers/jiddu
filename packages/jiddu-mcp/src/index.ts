#!/usr/bin/env node
// Jiddu MCP server — exposes the five Jiddu analysis tools over stdio.
//
// Each tool is a thin wrapper over POST /api/v1/* on the deployed Jiddu API.
// Configure JIDDU_API_KEY (required) and optionally JIDDU_API_URL via the MCP
// client's env block (see README).

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { call, type CallBody } from "./client.js";

const server = new McpServer({ name: "jiddu", version: "0.1.0" });

const textArg = z
  .string()
  .min(40, "Provide at least 40 characters.")
  .max(2000, "Keep the text under 2000 characters.")
  .describe("The text to analyze (40–2000 characters).");

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

server.tool(
  "detect_fallacies",
  "Analyze a text and return the logical fallacies it contains, each with the offending excerpt and an explanation. Use this before citing an argument, quoting a source, or including a persuasive claim in a document. Best for 50–2000 characters.",
  { text: textArg, lang: langArg },
  async ({ text, lang }) => toolResult("detect-fallacies", { text, lang }),
);

server.tool(
  "fact_check",
  "Extract the verifiable factual claims from a text and check each one against live web search, returning a per-claim verdict (true / false / misleading / unverifiable) plus an overall reliability verdict. Use to verify content before relying on it as a source. Slower and metered — each claim runs a web search.",
  { text: textArg, lang: langArg },
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
